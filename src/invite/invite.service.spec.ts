import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InviteService } from './invite.service';
import { Invite } from './invite.entity';
import { Doctor } from '../doctor/doctor.entity';
import { User } from '../user/user.entity';
import { Patient } from '../patient/patient.entity';

// ---- Tipi minimi per i DTO usati nel test ----
type CreateInviteDto = {
  email: string;
  cf: string;
  phone: string;
  weight?: number;
  height?: number;
  bloodType?: string;
  level?: string;
  sport?: string;
  pathologies?: string[];
  medications?: string[];
  injuries?: string[];
};

describe('InviteService.createInvite', () => {
  let service: InviteService;

  // Mocks dei repository
  const inviteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const doctorRepository = {
    findOne: jest.fn(),
  };

  const userRepository = {
    createQueryBuilder: jest.fn(),
  };

  const patientRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  // Helper per mockare la query builder chain: where(...).getOne()
  const mockQueryBuilder = (found: any | null) => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(found),
    };
    inviteRepository.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: getRepositoryToken(Invite), useValue: inviteRepository },
        { provide: getRepositoryToken(Doctor), useValue: doctorRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Patient), useValue: patientRepository },
      ],
    }).compile();

    service = module.get<InviteService>(InviteService);
  });

  const USER_ID = 'doctor-user-id-123';

  const createInviteDto: CreateInviteDto = {
    email: 'patient@example.com',
    cf: 'ABCDEF12G34H567I',
    phone: '3331112222',
    weight: 70,
    height: 175,
    bloodType: '0+',
    level: 'amateur',
    sport: 'running',
    pathologies: ['asma'],
    medications: ['farmacoX'],
    injuries: [],
  };

  test('crea paziente e invito quando non ci sono duplicati', async () => {
    // 1) il medico esiste
    const mockDoctor = {
      id: 'doctor-id-1',
      user: { id: USER_ID },
      userId: USER_ID,
    };
    doctorRepository.findOne.mockResolvedValue(mockDoctor);

    // 2) nessun invito duplicato
    const qb = mockQueryBuilder(null); // .getOne() => null

    // 3) salvataggio paziente
    const savedPatient = { id: 'patient-id-1' };
    patientRepository.create.mockImplementation((data) => ({
      id: 'temp',
      ...data,
    }));
    patientRepository.save.mockResolvedValue(savedPatient);

    // 4) salvataggio invito
    inviteRepository.create.mockImplementation((data) => ({
      id: 'invite-id-1',
      ...data,
    }));
    inviteRepository.save.mockResolvedValue({ id: 'invite-id-1' });

    const res = await service.createInvite(createInviteDto as any, USER_ID);

    // Asserzioni su flusso
    expect(doctorRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: USER_ID } },
      relations: ['user'],
    });

    expect(inviteRepository.createQueryBuilder).toHaveBeenCalledWith('invite');
    expect(qb.where).toHaveBeenCalledWith(
      'invite.cf = :cf OR invite.phone =:phone OR invite.email = :email',
      {
        cf: createInviteDto.cf,
        phone: createInviteDto.phone,
        email: createInviteDto.email,
      },
    );
    expect(qb.getOne).toHaveBeenCalled();

    expect(patientRepository.create).toHaveBeenCalled();
    expect(patientRepository.save).toHaveBeenCalled();

    expect(inviteRepository.create).toHaveBeenCalled();
    expect(inviteRepository.save).toHaveBeenCalled();

    expect(res).toEqual({ patientId: 'patient-id-1' });
  });

  test('lancia BadRequestException se esiste un invito duplicato', async () => {
    // Medico trovato
    const mockDoctor = {
      id: 'doctor-id-1',
      user: { id: USER_ID },
      userId: USER_ID,
    };
    doctorRepository.findOne.mockResolvedValue(mockDoctor);

    // Duplicato presente
    mockQueryBuilder({ id: 'existing-invite-id' });

    await expect(
      service.createInvite(createInviteDto as any, USER_ID),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Non deve creare né paziente né invito
    expect(patientRepository.create).not.toHaveBeenCalled();
    expect(inviteRepository.create).not.toHaveBeenCalled();
  });

  test('lancia UnauthorizedException se il medico non esiste', async () => {
    doctorRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createInvite(createInviteDto as any, USER_ID),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    // Non deve neanche interrogare i duplicati
    expect(inviteRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(patientRepository.create).not.toHaveBeenCalled();
  });
});
