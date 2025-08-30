/**
 * Services Index - Export all data services
 * Centralized export for all agricultural data services
 */

// Core agricultural services
export { ProducersService } from './producers';
export { PlotsService } from './plots';
export { CropsService } from './crops';
export { OperationsService } from './operations';
export { ObservationsService } from './observations';
export { CooperativesService } from './cooperatives';

// Export types
export type {
  Producer,
  ProducerInsert,
  ProducerUpdate
} from './producers';

export type {
  Plot,
  PlotInsert,
  PlotUpdate
} from './plots';

export type {
  Crop,
  CropInsert,
  CropUpdate
} from './crops';

export type {
  Operation,
  OperationInsert,
  OperationUpdate
} from './operations';

export type {
  Observation,
  ObservationInsert,
  ObservationUpdate
} from './observations';

export type {
  Cooperative,
  CooperativeInsert,
  CooperativeUpdate
} from './cooperatives';
