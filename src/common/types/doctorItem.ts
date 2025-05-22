export interface UserWithoutPassword {
  id: string;
  name: string;
  surname: string;
  email: string;
  cf: string;
  birthDate: Date;
  gender: string;
  phone: string;
  role: string;
  address: string;
  city: string;
  cap: string;
  province: string;
}

export interface DoctorItem {
  userId: string;
  specialization: string;
  medicalOffice: string;
  registrationNumber: string;
  orderProvince: string;
  orderDate: Date;
  orderType: string;
  user: UserWithoutPassword;
}
