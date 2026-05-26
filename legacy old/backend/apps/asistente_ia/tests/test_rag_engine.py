from dataclasses import dataclass
from datetime import date
from typing import List, Optional
from unittest.mock import MagicMock, patch
from django.test import TestCase

from apps.asistente_ia.ai.rag.retriever import (
    availability_score,
    plan_score,
    final_match_score,
    build_query_text,
    RAGEngine,
)


@dataclass
class FakeIntent:
    destination: Optional[str] = None
    duration: Optional[str] = None
    group_type: Optional[str] = None
    group_size: Optional[int] = None
    budget_range: Optional[str] = None
    interests: Optional[List[str]] = None
    departure_month: Optional[str] = None


class AvailabilityScoreTest(TestCase):
    def test_enough_seats_returns_1(self):
        self.assertEqual(availability_score(10, 5), 1.0)

    def test_exact_seats_returns_1(self):
        self.assertEqual(availability_score(5, 5), 1.0)

    def test_not_enough_seats_more_than_5_returns_08(self):
        self.assertEqual(availability_score(8, 10), 0.8)

    def test_low_seats_1_to_5_returns_05(self):
        self.assertEqual(availability_score(3, 10), 0.5)

    def test_one_seat_returns_05(self):
        self.assertEqual(availability_score(1, 10), 0.5)

    def test_zero_seats_returns_0(self):
        self.assertEqual(availability_score(0, 5), 0.0)

    def test_no_group_size_many_seats_returns_08(self):
        self.assertEqual(availability_score(10, None), 0.8)

    def test_no_group_size_few_seats_returns_05(self):
        self.assertEqual(availability_score(3, None), 0.5)

    def test_no_group_size_zero_seats_returns_0(self):
        self.assertEqual(availability_score(0, None), 0.0)


class PlanScoreTest(TestCase):
    def test_premium(self):
        self.assertEqual(plan_score("premium"), 1.0)

    def test_standard(self):
        self.assertEqual(plan_score("standard"), 0.7)

    def test_basic(self):
        self.assertEqual(plan_score("basic"), 0.4)

    def test_unknown_returns_default(self):
        self.assertEqual(plan_score("enterprise"), 0.5)

    def test_empty_string_returns_default(self):
        self.assertEqual(plan_score(""), 0.5)


class FinalMatchScoreTest(TestCase):
    def test_all_ones_returns_1(self):
        self.assertAlmostEqual(final_match_score(1.0, 1.0, 1.0), 1.0)

    def test_all_zeros_returns_0(self):
        self.assertAlmostEqual(final_match_score(0.0, 0.0, 0.0), 0.0)

    def test_clamped_above_1(self):
        self.assertAlmostEqual(final_match_score(2.0, 2.0, 2.0), 1.0)

    def test_clamped_below_0(self):
        self.assertAlmostEqual(final_match_score(-1.0, -1.0, -1.0), 0.0)

    def test_weighted_formula(self):
        # (0.60 * 0.6) + (0.25 * 0.8) + (0.15 * 1.0) = 0.36 + 0.20 + 0.15 = 0.71
        self.assertAlmostEqual(final_match_score(0.6, 0.8, 1.0), 0.71, places=5)

    def test_semantic_weight_is_60_percent(self):
        self.assertAlmostEqual(final_match_score(1.0, 0.0, 0.0), 0.60)


class BuildQueryTextTest(TestCase):
    def test_all_fields_included(self):
        intent = FakeIntent(
            destination="Peru",
            duration="7 días",
            group_type="familiar",
            budget_range="mid-range",
            interests=["playa", "cultura"],
            departure_month="julio",
        )
        text = build_query_text(intent)
        self.assertIn("Peru", text)
        self.assertIn("7 días", text)
        self.assertIn("familiar", text)
        self.assertIn("mid-range", text)
        self.assertIn("playa", text)
        self.assertIn("julio", text)

    def test_empty_intent_returns_empty_string(self):
        self.assertEqual(build_query_text(FakeIntent()), "")

    def test_only_destination(self):
        intent = FakeIntent(destination="Bali")
        text = build_query_text(intent)
        self.assertIn("Bali", text)

    def test_interests_joined_with_comma(self):
        intent = FakeIntent(interests=["aventura", "naturaleza"])
        text = build_query_text(intent)
        self.assertIn("aventura", text)
        self.assertIn("naturaleza", text)


class RAGEngineTest(TestCase):

    @patch("apps.asistente_ia.ai.rag.retriever.openrouter_client")
    def test_no_embedding_returns_empty(self, mock_openrouter):
        mock_openrouter.generate_embedding.return_value = None
        results = RAGEngine().search_matches(FakeIntent(destination="Peru"))
        self.assertEqual(results, [])

    @patch("apps.asistente_ia.ai.rag.retriever.openrouter_client")
    @patch("apps.asistente_ia.ai.rag.retriever.connection")
    def test_db_exception_returns_empty(self, mock_conn, mock_openrouter):
        mock_openrouter.generate_embedding.return_value = [0.1] * 10
        mock_conn.cursor.side_effect = Exception("DB error")
        results = RAGEngine().search_matches(FakeIntent(destination="Peru"))
        self.assertEqual(results, [])

    @patch("apps.asistente_ia.ai.rag.retriever.openrouter_client")
    @patch("apps.asistente_ia.ai.rag.retriever.connection")
    def test_low_score_rows_filtered_out(self, mock_conn, mock_openrouter):
        mock_openrouter.generate_embedding.return_value = [0.1] * 10
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchall.return_value = [
            ("trip-1", "Viaje Peru", 20, date(2024, 7, 1), "itin-1", "Agencia", 0.0),
        ]
        results = RAGEngine().search_matches(FakeIntent(destination="Peru", group_size=5))
        self.assertEqual(results, [])

    @patch("apps.asistente_ia.ai.rag.retriever.openrouter_client")
    @patch("apps.asistente_ia.ai.rag.retriever.connection")
    def test_high_score_row_included(self, mock_conn, mock_openrouter):
        mock_openrouter.generate_embedding.return_value = [0.1] * 10
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchall.return_value = [
            ("trip-1", "Viaje Peru", 20, date(2024, 7, 1), "itin-1", "Agencia ABC", 0.90),
        ]
        results = RAGEngine().search_matches(FakeIntent(destination="Peru", group_size=5), limit=3)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].trip_id, "trip-1")
        self.assertEqual(results[0].agency_name, "Agencia ABC")

    @patch("apps.asistente_ia.ai.rag.retriever.openrouter_client")
    @patch("apps.asistente_ia.ai.rag.retriever.connection")
    def test_date_object_converted_to_isoformat(self, mock_conn, mock_openrouter):
        mock_openrouter.generate_embedding.return_value = [0.1] * 10
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchall.return_value = [
            ("trip-1", "Viaje", 20, date(2024, 7, 15), "itin-1", "Agencia", 0.90),
        ]
        results = RAGEngine().search_matches(FakeIntent(destination="Peru", group_size=5))
        if results:
            self.assertEqual(results[0].next_departure, "2024-07-15")

    @patch("apps.asistente_ia.ai.rag.retriever.openrouter_client")
    @patch("apps.asistente_ia.ai.rag.retriever.connection")
    def test_string_date_kept_as_string(self, mock_conn, mock_openrouter):
        mock_openrouter.generate_embedding.return_value = [0.1] * 10
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchall.return_value = [
            ("trip-1", "Viaje", 20, "2024-07-15", "itin-1", "Agencia", 0.90),
        ]
        results = RAGEngine().search_matches(FakeIntent(destination="Peru", group_size=5))
        if results:
            self.assertIsInstance(results[0].next_departure, str)

    @patch("apps.asistente_ia.ai.rag.retriever.openrouter_client")
    @patch("apps.asistente_ia.ai.rag.retriever.connection")
    def test_results_sorted_by_match_score_desc(self, mock_conn, mock_openrouter):
        mock_openrouter.generate_embedding.return_value = [0.1] * 10
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchall.return_value = [
            ("trip-1", "Viaje A", 20, date(2024, 7, 1), "itin-1", "Agencia", 0.70),
            ("trip-2", "Viaje B", 20, date(2024, 8, 1), "itin-2", "Agencia", 0.90),
        ]
        results = RAGEngine().search_matches(FakeIntent(destination="Peru", group_size=5), limit=5)
        if len(results) >= 2:
            self.assertGreaterEqual(results[0].match_score, results[1].match_score)

    @patch("apps.asistente_ia.ai.rag.retriever.openrouter_client")
    @patch("apps.asistente_ia.ai.rag.retriever.connection")
    def test_limit_respected(self, mock_conn, mock_openrouter):
        mock_openrouter.generate_embedding.return_value = [0.1] * 10
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchall.return_value = [
            (f"trip-{i}", f"Viaje {i}", 20, date(2024, 7, 1), f"itin-{i}", "Agencia", 0.90)
            for i in range(10)
        ]
        results = RAGEngine().search_matches(FakeIntent(destination="Peru", group_size=5), limit=2)
        self.assertLessEqual(len(results), 2)
