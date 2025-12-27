import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
import { Task } from "./task.entity";

export class Project {
    @IsNumber()
    id: number;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsArray()
    tasks: Task[];
}
