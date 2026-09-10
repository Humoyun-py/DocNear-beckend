import { LocationCoordinates } from '../types';
import { apiList, apiRequest } from './apiClient';
import { ClinicDto, mapClinic } from './apiModels';
import { isMatchingSpecialty } from '../utils/specialtyTranslations';
export const clinicService = {
 async getPartnerClinics(coords?: LocationCoordinates) { return (await apiList<ClinicDto>('clinics/')).map(c => mapClinic(c, coords)); },
 async getNearbyClinics(coords: LocationCoordinates, radiusKm = 5) {
  return (await apiList<ClinicDto>('clinics/nearby/?latitude=' + coords.lat + '&longitude=' + coords.lng + '&radius=' + radiusKm)).map(c => mapClinic(c, coords));
 },
 async getClinicById(id: string, coords?: LocationCoordinates) { return mapClinic(await apiRequest<ClinicDto>('clinics/' + id + '/'), coords); },
 async getEmergencyClinics(coords?: LocationCoordinates) { return (await this.getPartnerClinics(coords)).filter(c => c.isEmergency24x7); },
 async searchClinics(query: string, specialty?: string, coords?: LocationCoordinates, maxDistanceKm = 5) {
  const list = await this.getPartnerClinics(coords);
  return list.filter(c => (!query || (c.name + ' ' + c.description + ' ' + c.address).toLowerCase().includes(query.toLowerCase())) &&
    (!specialty || specialty === 'all' || c.specialties.some(s => isMatchingSpecialty(s, specialty))) &&
    (c.distanceKm === undefined || c.distanceKm <= maxDistanceKm));
 }
};
