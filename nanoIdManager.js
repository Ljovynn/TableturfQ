import { customAlphabet } from 'nanoid'

export const idSize = 16;
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', idSize)

export function GenerateNanoId(){
    return nanoid(idSize);
}