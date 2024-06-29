import { nanoid } from 'nanoid'

export const idSize = 16;

export function GenerateNanoId(){
    return nanoid(idSize);
}