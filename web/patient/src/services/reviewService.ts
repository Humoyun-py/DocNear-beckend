import { Review } from '../types';
import { apiList, apiRequest } from './apiClient';
function mapReview(r: any, targetType: 'doctor'|'clinic'): Review {
 return {id: String(r.id), targetId: String(r[targetType]), targetType, userName: r.patient_name || 'Bemor', rating: r.rating, comment: r.comment, date: r.created_at, isVerifiedPatient: true};
}
export class ReviewService {
 private cache: Record<string,Review[]> = {};
 async getReviewsForTarget(targetId: string, targetType: 'clinic'|'doctor' = 'doctor'): Promise<Review[]> {
  const rows = (await apiList<any>('reviews/?' + targetType + '=' + targetId)).map(r => mapReview(r,targetType));
  this.cache[targetType + targetId] = rows; return rows;
 }
 async getAllReviews(): Promise<Review[]> { return (await apiList<any>('reviews/')).map(r => mapReview(r, 'doctor')); }
 async addReview(data: {targetId: string; targetType: 'clinic'|'doctor'; targetName?: string; userName: string; userAvatar?: string; userEmail?: string; rating: number; comment: string; tags?: string[]}): Promise<Review> {
  const appointments = await apiList<any>('appointments/?status=completed');
  const eligible = appointments.find(a => String(a[data.targetType]) === data.targetId);
  if (!eligible) throw new Error('Sharh yozish uchun yakunlangan qabul kerak');
  return mapReview(await apiRequest('reviews/', {method:'POST', body:JSON.stringify({appointment:eligible.id,rating:data.rating,comment:data.comment})}),data.targetType);
 }
 calculateRatingStats(id: string, type: 'clinic'|'doctor', _rating = 0, _count = 0) {
  const reviews = this.cache[type + id] || [];
  const distribution = {1:0,2:0,3:0,4:0,5:0};
  reviews.forEach(r => { distribution[r.rating as 1|2|3|4|5]++; });
  const percentages = {...distribution};
  for (const key of [1,2,3,4,5] as const) percentages[key] = reviews.length ? Math.round(100*distribution[key]/reviews.length) : 0;
  return {averageRating: reviews.length ? reviews.reduce((sum,r) => sum+r.rating,0)/reviews.length : 0, totalReviews:reviews.length,distribution,percentages};
 }
}
export const reviewService = new ReviewService();
