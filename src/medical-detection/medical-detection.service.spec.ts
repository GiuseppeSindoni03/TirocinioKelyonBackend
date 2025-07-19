import { Test, TestingModule } from '@nestjs/testing';
import { MedicalDetectionService } from './medical-detection.service';

describe('MedicalDetectionService', () => {
  let service: MedicalDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalDetectionService],
    }).compile();

    service = module.get<MedicalDetectionService>(MedicalDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
