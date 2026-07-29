// Personagens antigos do Re-Dungeon (criados antes do campo `tipo` existir)
// não têm esse campo gravado — tratá-los como "Personagem Jogável" replica
// o mesmo fallback já usado na ficha de personagem (Ficha-RPG---Re-Dungeon-).
export const TIPO_PERSONAGEM_PADRAO = 'Personagem Jogável';

export const getTipoPersonagem = personagem => personagem?.tipo ?? TIPO_PERSONAGEM_PADRAO;
