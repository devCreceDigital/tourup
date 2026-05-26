from django.urls import path
from . import views

urlpatterns = [
    path("sessions/", views.CreateSessionView.as_view(), name="create-session"),
    path("sessions/<uuid:pk>/message/", views.MessageView.as_view(), name="send-message"),
    path("leads/", views.CreateLeadView.as_view(), name="create-lead"),
    path("agency/leads/", views.AgencyLeadsListView.as_view(), name="agency-leads-list"),
    path("agency/leads/<uuid:pk>/", views.AgencyLeadDetailView.as_view(), name="agency-leads-detail"),
    path(
        "agency/leads/<uuid:pk>/status/",
        views.LeadStatusUpdateView.as_view(),
        name="agency-leads-update-status",
    ),
    path('leads/simple/', views.SimpleLeadView.as_view(), name='simple-lead'),
    path('trips/', views.SaveTripPlanView.as_view(), name='save-trip'),
    path('trips-list/', views.ListTripsView.as_view(), name='list-trips'),
    path('stats/', views.StatsView.as_view(), name='stats'),
    path('trips/<str:share_token>/', views.GetTripPlanView.as_view(), name='get-trip'),
    path('trips/<str:share_token>/pdf/', views.TripPlanPdfView.as_view(), name='trip-pdf'),
]