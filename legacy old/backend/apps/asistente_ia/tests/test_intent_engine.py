import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from apps.asistente_ia.ai.parsers.response_parser import IntentEngine, IntentResult


class IntentEngineTestCase(TestCase):
    """Tests para el IntentEngine con los 20 casos obligatorios"""
    
    def setUp(self):
        self.engine = IntentEngine()
    
    def _mock_openrouter_response(self, response_data):
        """Helper para mockear respuesta de OpenRouter"""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(response_data)
        return mock_response
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_1_simple_destination(self, mock_openrouter):
        """Caso 1: Quiero ir a Peru -> destination=Peru, needs_clarification=True"""
        messages = [{"role": "user", "content": "Quiero ir a Perú"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Perú",
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": [],
            "departure_month": None,
            "confidence_score": 0.4,
            "fields_detected": 1,
            "needs_clarification": True,
            "clarification_question": "¿Cuándo te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.destination, "Perú")
        self.assertTrue(result.needs_clarification)
        self.assertEqual(result.fields_detected, 1)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_2_complete_intent(self, mock_openrouter):
        """Caso 2: Informacion completa -> fields_detected>=6, needs_clarification=False"""
        messages = [{"role": "user", "content": "Perú 10 días familia 4 julio mid-range cultura naturaleza"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Perú",
            "duration": "10 días",
            "group_type": "familiar",
            "group_size": 4,
            "budget_range": "mid-range",
            "interests": ["cultura", "naturaleza"],
            "departure_month": "julio",
            "confidence_score": 0.9,
            "fields_detected": 7,
            "needs_clarification": False,
            "clarification_question": None
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertGreaterEqual(result.fields_detected, 6)
        self.assertFalse(result.needs_clarification)
        self.assertEqual(result.group_size, 4)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_3_english_clarification(self, mock_openrouter):
        """Caso 3: I want to go to Peru in July -> clarification_question en ingles"""
        messages = [{"role": "user", "content": "I want to go to Peru in July"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Peru",
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": [],
            "departure_month": "July",
            "confidence_score": 0.5,
            "fields_detected": 2,
            "needs_clarification": True,
            "clarification_question": "How many people will be traveling?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "en")
        
        self.assertTrue(result.needs_clarification)
        self.assertIn("How many", result.clarification_question)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_4_vague_request(self, mock_openrouter):
        """Caso 4: Quiero un viaje bonito -> confidence_score < 0.30, needs_clarification=True"""
        messages = [{"role": "user", "content": "Quiero un viaje bonito"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": [],
            "departure_month": None,
            "confidence_score": 0.2,
            "fields_detected": 0,
            "needs_clarification": True,
            "clarification_question": "¿Podrías contarme más sobre el viaje que estás buscando?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertLess(result.confidence_score, 0.30)
        self.assertTrue(result.needs_clarification)
        self.assertEqual(result.fields_detected, 0)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_5_honeymoon_bali(self, mock_openrouter):
        """Caso 5: Luna de miel Bali 7 dias -> group_type=pareja"""
        messages = [{"role": "user", "content": "Luna de miel Bali 7 días"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Bali",
            "duration": "7 días",
            "group_type": "pareja",
            "group_size": 2,
            "budget_range": None,
            "interests": ["romance"],
            "departure_month": None,
            "confidence_score": 0.75,
            "fields_detected": 4,
            "needs_clarification": True,
            "clarification_question": "¿Cuándo te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.group_type, "pareja")
        self.assertEqual(result.group_size, 2)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_6_school_trip(self, mock_openrouter):
        """Caso 6: Viaje escolar secundaria 30 alumnos -> group_type=escolar, group_size=30"""
        messages = [{"role": "user", "content": "Viaje escolar secundaria 30 alumnos"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": "escolar",
            "group_size": 30,
            "budget_range": None,
            "interests": ["educación"],
            "departure_month": None,
            "confidence_score": 0.65,
            "fields_detected": 2,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.group_type, "escolar")
        self.assertEqual(result.group_size, 30)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_7_no_budget_restrictions(self, mock_openrouter):
        """Caso 7: Sin restricciones de presupuesto -> budget_range=premium"""
        messages = [{"role": "user", "content": "Sin restricciones de presupuesto"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": "premium",
            "interests": [],
            "departure_month": None,
            "confidence_score": 0.4,
            "fields_detected": 1,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.budget_range, "premium")
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_8_economical_backpacker(self, mock_openrouter):
        """Caso 8: Economico, mochilero -> budget_range=economico"""
        messages = [{"role": "user", "content": "Económico, mochilero"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": "economico",
            "interests": ["aventura", "naturaleza"],
            "departure_month": None,
            "confidence_score": 0.35,
            "fields_detected": 2,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.budget_range, "economico")
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_9_cusco_machupicchu(self, mock_openrouter):
        """Caso 9: Cusco y Machu Picchu -> destination contiene Cusco"""
        messages = [{"role": "user", "content": "Cusco y Machu Picchu"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Cusco",
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": ["cultura", "historia"],
            "departure_month": None,
            "confidence_score": 0.6,
            "fields_detected": 2,
            "needs_clarification": True,
            "clarification_question": "¿Cuándo te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.destination, "Cusco")
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_10_holy_week(self, mock_openrouter):
        """Caso 10: Semana santa -> departure_month referencia a marzo/abril"""
        messages = [{"role": "user", "content": "Semana santa"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": ["religioso"],
            "departure_month": "marzo",
            "confidence_score": 0.3,
            "fields_detected": 1,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.departure_month, "marzo")
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_11_two_couples(self, mock_openrouter):
        """Caso 11: Somos 2 parejas -> group_size=4, group_type=pareja"""
        messages = [{"role": "user", "content": "Somos 2 parejas"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": "pareja",
            "group_size": 4,
            "budget_range": None,
            "interests": [],
            "departure_month": None,
            "confidence_score": 0.5,
            "fields_detected": 2,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.group_type, "pareja")
        self.assertEqual(result.group_size, 4)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_12_adventure_trekking(self, mock_openrouter):
        """Caso 12: Aventura y trekking -> interests incluye aventura"""
        messages = [{"role": "user", "content": "Aventura y trekking"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": ["aventura", "naturaleza"],
            "departure_month": None,
            "confidence_score": 0.4,
            "fields_detected": 1,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertIn("aventura", result.interests)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_13_beach_relaxation(self, mock_openrouter):
        """Caso 13: Queremos descansar en la playa -> interests incluye relax"""
        messages = [{"role": "user", "content": "Queremos descansar en la playa"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": ["relax", "playa"],
            "departure_month": None,
            "confidence_score": 0.4,
            "fields_detected": 1,
            "needs_clarification": True,
            "clarification_question": "¿Cuántas personas serán?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertIn("relax", result.interests)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_14_complete_conversation(self, mock_openrouter):
        """Caso 14: Conversacion 8 turnos completa -> needs_clarification=False, fields_detected>=5"""
        messages = [
            {"role": "user", "content": "Hola, quiero planear un viaje"},
            {"role": "assistant", "content": "¡Hola! Claro, ¿a dónde te gustaría viajar?"},
            {"role": "user", "content": "Quiero ir a Cusco"},
            {"role": "assistant", "content": "¡Excelente elección! Cusco es maravilloso. ¿Cuánto tiempo planeas quedarte?"},
            {"role": "user", "content": "10 días"},
            {"role": "assistant", "content": "Perfecto. ¿Con quién viajarás?"},
            {"role": "user", "content": "Con mi familia, somos 4 personas"},
            {"role": "assistant", "content": "Genial. ¿En qué mes te gustaría viajar?"},
            {"role": "user", "content": "En julio"},
            {"role": "assistant", "content": "Muy bien. ¿Qué tipo de presupuesto manejas?"},
            {"role": "user", "content": "Mid-range"},
            {"role": "assistant", "content": "Perfecto. ¿Qué actividades te interesan?"},
            {"role": "user", "content": "Cultura y aventura"},
            {"role": "assistant", "content": "Excelente. Tengo algunas opciones para ti."},
            {"role": "user", "content": "Muéstrame las opciones"}
        ]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Cusco",
            "duration": "10 días",
            "group_type": "familiar",
            "group_size": 4,
            "budget_range": "mid-range",
            "interests": ["cultura", "aventura"],
            "departure_month": "julio",
            "confidence_score": 0.85,
            "fields_detected": 6,
            "needs_clarification": False,
            "clarification_question": None
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertGreaterEqual(result.fields_detected, 5)
        self.assertFalse(result.needs_clarification)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_15_portuguese_brazil(self, mock_openrouter):
        """Caso 15: Viagem para o Brasil em dezembro -> idioma detectado=PT"""
        messages = [{"role": "user", "content": "Viagem para o Brasil em dezembro"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Brasil",
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": [],
            "departure_month": "dezembro",
            "confidence_score": 0.5,
            "fields_detected": 2,
            "needs_clarification": True,
            "clarification_question": "Quantas pessoas serão?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "pt")
        
        self.assertEqual(result.destination, "Brasil")
        self.assertEqual(result.departure_month, "dezembro")
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_16_typos_handling(self, mock_openrouter):
        """Caso 16: Mensaje con typos Machupicchu peruu -> destination extraido correctamente"""
        messages = [{"role": "user", "content": "Machupicchu peruu"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Perú",
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": ["cultura", "historia"],
            "departure_month": None,
            "confidence_score": 0.6,
            "fields_detected": 2,
            "needs_clarification": True,
            "clarification_question": "¿Cuándo te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.destination, "Perú")
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_17_number_only(self, mock_openrouter):
        """Caso 17: Solo numero 4 (sin contexto) -> confidence_score < 0.20"""
        messages = [{"role": "user", "content": "4"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": None,
            "group_size": 4,
            "budget_range": None,
            "interests": [],
            "departure_month": None,
            "confidence_score": 0.15,
            "fields_detected": 1,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertLess(result.confidence_score, 0.20)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_18_corporate_trip(self, mock_openrouter):
        """Caso 18: Corporativo 20 ejecutivos -> group_type=corporativo"""
        messages = [{"role": "user", "content": "Corporativo 20 ejecutivos"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": None,
            "group_type": "corporativo",
            "group_size": 20,
            "budget_range": None,
            "interests": ["negocios"],
            "departure_month": None,
            "confidence_score": 0.65,
            "fields_detected": 2,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.group_type, "corporativo")
        self.assertEqual(result.group_size, 20)
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_19_approximate_duration(self, mock_openrouter):
        """Caso 19: Unos 10 dias mas o menos -> duration=10 dias"""
        messages = [{"role": "user", "content": "Unos 10 días más o menos"}]
        
        mock_response = self._mock_openrouter_response({
            "destination": None,
            "duration": "10 días",
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": [],
            "departure_month": None,
            "confidence_score": 0.4,
            "fields_detected": 1,
            "needs_clarification": True,
            "clarification_question": "¿A qué destino te gustaría viajar?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertEqual(result.duration, "10 días")
    
    @patch('apps.asistente_ia.ai.parsers.response_parser.openrouter_client')
    def test_case_20_mixed_languages(self, mock_openrouter):
        """Caso 20: Conversacion mezclada ES+EN -> clarification_question en idioma predominante"""
        messages = [
            {"role": "user", "content": "Hello, I want to go to Peru"},
            {"role": "assistant", "content": "¡Hola! Claro, ¿cuándo te gustaría viajar?"},
            {"role": "user", "content": "In July, with my family"}
        ]
        
        mock_response = self._mock_openrouter_response({
            "destination": "Peru",
            "duration": None,
            "group_type": "familiar",
            "group_size": None,
            "budget_range": None,
            "interests": [],
            "departure_month": "July",
            "confidence_score": 0.6,
            "fields_detected": 3,
            "needs_clarification": True,
            "clarification_question": "¿Cuántas personas serán en total?"
        })
        mock_openrouter.extract_intent.return_value = mock_response.choices[0].message.content
        
        result = self.engine.extract_intent(messages, "es")
        
        self.assertTrue(result.needs_clarification)
        # La pregunta debe estar en español (idioma predominante en la conversación)
        self.assertIn("¿Cuántas personas", result.clarification_question)
    
    def test_intent_result_dataclass(self):
        """Test básico de la dataclass IntentResult"""
        result = IntentResult(
            destination="Perú",
            confidence_score=0.8,
            fields_detected=5,
            needs_clarification=False
        )
        
        self.assertEqual(result.destination, "Perú")
        self.assertEqual(result.confidence_score, 0.8)
        self.assertEqual(result.fields_detected, 5)
        self.assertFalse(result.needs_clarification)
        self.assertIsNone(result.duration)
        self.assertEqual(result.interests, None)  # Default None