import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Product } from './product.definition';
import { CreateProductInput } from './dto/create-product.input';
import { OutputType } from 'dryerjs';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';

@Resolver()
export class ProductResolver {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) {}

  @Mutation(() => String, { name: 'createProductTest' })
  async create(@Args('input') input: CreateProductInput) {
    const users = await this.firebase.auth.listUsers(1);
    console.log(users.users[0].toJSON());
    return '123';
  }
}
