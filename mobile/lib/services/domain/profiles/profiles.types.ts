/**
 * Types pour le service des profils
 */

import { Tables, TablesUpdate } from '../../../../../types/database';

export type Profile = Tables<'profiles'>;

export type ProfileUpdateInput = Pick<
  TablesUpdate<'profiles'>,
  'display_name' | 'region' | 'department' | 'commune'
>;


