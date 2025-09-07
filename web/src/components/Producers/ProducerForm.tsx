/**
 * ProducerForm Component - Reusable form for adding/editing producers
 * Handles form validation, state management, and submission
 */

import React, { useState, useEffect } from 'react';
import { producersService, cooperativesService } from '../../../../lib/services/api';
import { Database } from '../../../../lib/supabase/types/database';

type Producer = Database['public']['Tables']['producers']['Row'];
type Cooperative = Database['public']['Tables']['cooperatives']['Row'];

interface ProducerFormProps {
  producer?: Producer;
  onSubmit: (data: Partial<Producer>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProducerForm: React.FC<ProducerFormProps> = ({
  producer,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Producer>>({
    first_name: '',
    last_name: '',
    phone: '',
    cooperative_id: '',
    region: '',
    department: '',
    commune: '',
    village: '',
    gender: 'M',
    birth_date: '',
    education_level: '',
    household_size: 1,
    farming_experience_years: 0,
    primary_language: 'fr',
    address: '',
    email: '',
    is_active: true
  });

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cooperatives on component mount
  useEffect(() => {
    const loadCooperatives = async () => {
      try {
        setLoading(true);
        const response = await cooperativesService.getAll({ limit: 100 });
        setCooperatives(response.data);
      } catch (err) {
        setError('Failed to load cooperatives');
        console.error('Error loading cooperatives:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCooperatives();
  }, []);

  // Load producer data if editing
  useEffect(() => {
    if (producer) {
      setFormData({
        first_name: producer.first_name || '',
        last_name: producer.last_name || '',
        phone: producer.phone || '',
        cooperative_id: producer.cooperative_id || '',
        region: producer.region || '',
        department: producer.department || '',
        commune: producer.commune || '',
        village: producer.village || '',
        gender: producer.gender || 'M',
        birth_date: producer.birth_date || '',
        education_level: producer.education_level || '',
        household_size: producer.household_size || 1,
        farming_experience_years: producer.farming_experience_years || 0,
        primary_language: producer.primary_language || 'fr',
        address: producer.address || '',
        email: producer.email || '',
        is_active: producer.is_active ?? true
      });
    }
  }, [producer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.phone || !formData.cooperative_id || 
          !formData.region || !formData.department || !formData.commune || !formData.village) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate phone number format (+221XXXXXXXXX)
      const phoneRegex = /^\+221[0-9]{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('Phone number must be in format +221XXXXXXXXX');
        return;
      }

      onSubmit(formData);
    } catch (err) {
      setError('Failed to submit form');
      console.error('Form submission error:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading cooperatives...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+221XXXXXXXXX"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
              Birth Date
            </label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={formData.birth_date || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Location</h3>
          
          <div>
            <label htmlFor="cooperative_id" className="block text-sm font-medium text-gray-700">
              Cooperative *
            </label>
            <select
              id="cooperative_id"
              name="cooperative_id"
              value={formData.cooperative_id}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select a cooperative</option>
              {cooperatives.map((coop) => (
                <option key={coop.id} value={coop.id}>
                  {coop.name} - {coop.region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
              Region *
            </label>
            <input
              type="text"
              id="region"
              name="region"
              value={formData.region || ''}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department *
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department || ''}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="commune" className="block text-sm font-medium text-gray-700">
              Commune *
            </label>
            <input
              type="text"
              id="commune"
              name="commune"
              value={formData.commune || ''}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="village" className="block text-sm font-medium text-gray-700">
              Village *
            </label>
            <input
              type="text"
              id="village"
              name="village"
              value={formData.village || ''}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="education_level" className="block text-sm font-medium text-gray-700">
              Education Level
            </label>
            <select
              id="education_level"
              name="education_level"
              value={formData.education_level || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select education level</option>
              <option value="none">None</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="higher">Higher</option>
            </select>
          </div>

          <div>
            <label htmlFor="household_size" className="block text-sm font-medium text-gray-700">
              Household Size
            </label>
            <input
              type="number"
              id="household_size"
              name="household_size"
              value={formData.household_size || 1}
              onChange={handleInputChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="farming_experience_years" className="block text-sm font-medium text-gray-700">
              Farming Experience (years)
            </label>
            <input
              type="number"
              id="farming_experience_years"
              name="farming_experience_years"
              value={formData.farming_experience_years || 0}
              onChange={handleInputChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="primary_language" className="block text-sm font-medium text-gray-700">
            Primary Language
          </label>
          <select
            id="primary_language"
            name="primary_language"
            value={formData.primary_language || 'fr'}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="fr">French</option>
            <option value="wo">Wolof</option>
            <option value="pe">Pulaar</option>
            <option value="se">Serer</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Status</h3>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active ?? true}
            onChange={handleInputChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Active producer
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : producer ? 'Update Producer' : 'Create Producer'}
        </button>
      </div>
    </form>
  );
};

export default ProducerForm;
