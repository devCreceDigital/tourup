from django.urls import path
from .views import TicketCreateView, TicketListView, TicketUpdateView

urlpatterns = [
    path("tickets/", TicketCreateView.as_view(), name="ticket-create"),
    path("tickets/list/", TicketListView.as_view(), name="ticket-list"),
    path("tickets/<uuid:ticket_id>/", TicketUpdateView.as_view(), name="ticket-update"),
]
