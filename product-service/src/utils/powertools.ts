import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';

export const logger = new Logger({
  serviceName: 'productService',
});

export const metrics = new Metrics({
  namespace: 'paintingStore',
  serviceName: 'productService'
});
