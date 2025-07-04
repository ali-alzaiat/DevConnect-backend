import { Injectable } from "@nestjs/common";

@Injectable()
export class ArticalService {

  getAllArticals(): string {
    return "This is all articles!";
  }

  getArticalById(id: number): string {
    return `This is article with id ${id}`;
  }
}