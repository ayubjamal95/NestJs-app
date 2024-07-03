import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsNotEmpty({ message: 'Job should not be empty' })
  job: string;
}
