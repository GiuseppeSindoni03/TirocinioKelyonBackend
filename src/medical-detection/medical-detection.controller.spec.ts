import { Test, TestingModule } from '@nestjs/testing';
import { MedicalDetectionController } from './medical-detection.controller';

describe('MedicalDetectionController', () => {
  let controller: MedicalDetectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalDetectionController],
    }).compile();

    controller = module.get<MedicalDetectionController>(MedicalDetectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
