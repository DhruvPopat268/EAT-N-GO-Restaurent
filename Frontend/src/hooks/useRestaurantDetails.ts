import { useState, useEffect } from 'react';
import axios from 'axios';

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
        const token = localStorage.getItem('RestaurantToken');
        if (!token) {
          setError('Restaurant token not found');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/restaurants/usefullDetails`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

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