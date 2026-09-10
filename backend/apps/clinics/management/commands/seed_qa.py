"""Explicit, repeatable local QA fixtures. Never enabled in production settings."""
import json
import os
from datetime import time, timedelta
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from apps.accounts.models import User
from apps.clinics.models import Clinic, ClinicService
from apps.doctors.models import DoctorProfile, DoctorClinic
from apps.specialties.models import Specialty
from apps.schedules.models import DoctorSchedule


class Command(BaseCommand):
    help = 'Create fictional QA fixtures. Set DOCNEAR_QA_PASSWORD; use only an isolated development DB.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-password',
            action='store_true',
            help='Reset existing QA fixture passwords to DOCNEAR_QA_PASSWORD.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('QA fixtures are forbidden when DEBUG=False.')
        password = os.getenv('DOCNEAR_QA_PASSWORD')
        if not password:
            raise CommandError('Set DOCNEAR_QA_PASSWORD in the process environment (it is never printed).')
        validate_password(password)
        accounts = {}
        for alias, role in [('patient','patient'),('patient-b','patient'),('doctor','doctor'),('owner','clinic_owner'),('admin','admin'),('super-admin','super_admin')]:
            email = f'qa.{alias}@docnear.example'
            user = User.objects.filter(email=email).first()
            if user:
                if user.role != role or not user.first_name.startswith('QA '):
                    raise CommandError(f'Refusing to overwrite a non-QA account at {email}.')
                if not user.check_password(password):
                    if not options['reset_password']:
                        raise CommandError(f'Existing QA credentials do not match for {email}; use the original password or a fresh QA database.')
                    user.set_password(password)
                    user.save(update_fields=['password', 'updated_at'])
            else:
                user = User.objects.create_user(email=email, password=password, first_name=f'QA {alias.title()}', role=role, is_verified=True)
            accounts[alias] = user
        specialty, _ = Specialty.objects.get_or_create(slug='qa-cardiology', defaults={'name':'QA Cardiology (fictional)', 'icon_name':'heart-pulse', 'search_aliases':'kardi QA'})
        service, _ = ClinicService.objects.get_or_create(slug='qa-consultation', defaults={'name':'QA Consultation (fictional)'})
        clinic, _ = Clinic.objects.get_or_create(slug='qa-clinic', defaults={'owner':accounts['owner'], 'name':'QA Clinic (fictional)', 'description':'QA fixture only; not a real clinic.', 'address':'Fictional QA address, Tashkent',
            'latitude':41.3111, 'longitude':69.2797, 'is_partner':True, 'is_verified':True,
            'working_hours':{str(day):[['08:00','18:00']] for day in range(7)}})
        clinic.services.add(service)
        doctor, _ = DoctorProfile.objects.get_or_create(user=accounts['doctor'], defaults={'bio':'Fictional QA profile. No actual qualifications claimed.', 'is_verified':True})
        relation, _ = DoctorClinic.objects.get_or_create(doctor=doctor, clinic=clinic, defaults={'specialty':specialty})
        for day in range(7):
            DoctorSchedule.objects.get_or_create(doctor=doctor, clinic=clinic, day_of_week=day, defaults={'start_time':time(9), 'end_time':time(17)})
        tomorrow = timezone.localdate() + timedelta(days=1)
        self.stdout.write(json.dumps({'doctor_id':doctor.pk,'clinic_id':clinic.pk,'patient_id':accounts['patient'].pk,
            'owner_id':accounts['owner'].pk,'admin_id':accounts['admin'].pk,'specialty_id':specialty.pk,'service_id':service.pk,
            'affiliation_id':relation.pk,'date':str(tomorrow),'booking_weekday':tomorrow.weekday(),
            'accounts':{alias:user.email for alias,user in accounts.items()}}, indent=2))
