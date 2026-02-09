import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosConfig';

interface RestaurantDetails {
  foodCategory: string[];
  country: string;
}

export const useRestaurantDetails = () => {
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const response = await axiosInstance.get('/api/restaurants/usefullDetails');

        setRestaurantDetails(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch restaurant details');
        console.error('Error fetching restaurant details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, []);

  return { restaurantDetails, loading, error };
};