import { PERSONAS } from 'common/utils/chat';
import { ehNpcDaCampanha } from 'pages/Npcs/npcUtils';
import { ehCriaturaDaCampanha } from 'pages/Criaturas/criaturaUtils';
import { ehJogadorDaCampanha } from 'pages/Jogadores/jogadoresUtils';

// Opções do "Falando como" do mestre no Chat: ele mesmo ou qualquer NPC/
// Criatura da mesa — os mesmos que aparecem nas telas de NPCs/Criaturas da
// campanha ativa (personagens do Universo vinculados a ela). Se o mestre
// preencheu um clone da campanha, o nome/imagem do clone vencem os do
// personagem de origem, como na visualização dessas telas.

export const PERSONA_MESTRE = {
  id: PERSONAS.MESTRE,
  label: 'Mestre',
  avatar: null,
  persona: PERSONAS.MESTRE,
};

const porNome = (a, b) => a.label.localeCompare(b.label);

const montarGrupo = (personagens, clones, pertence, campanha, persona) =>
  personagens
    .filter(personagem => pertence(personagem, campanha))
    .map(personagem => {
      const clone = clones.find(c => c.origemPersonagemId === personagem.id);
      return {
        id: `${persona}:${personagem.id}`,
        refId: personagem.id,
        label: clone?.nome || personagem.nome || 'Sem nome',
        avatar: clone?.linkImagem || personagem.linkImagem || null,
        persona,
      };
    })
    .sort(porNome);

export const montarPersonasDoMestre = ({
  personagens,
  npcClones,
  criaturaClones,
  campanha,
}) => ({
  npcs: montarGrupo(
    personagens,
    npcClones,
    ehNpcDaCampanha,
    campanha,
    PERSONAS.NPC,
  ),
  criaturas: montarGrupo(
    personagens,
    criaturaClones,
    ehCriaturaDaCampanha,
    campanha,
    PERSONAS.CRIATURA,
  ),
});

// Personagens jogáveis da campanha (tela Jogadores, com o clone da campanha
// vencendo nome/imagem) — origem dos tokens de jogador do Grid. `uid` = dono
// da ficha, que vira dono do token.
export const montarJogadoresDaMesa = ({ personagens, clones, campanha }) =>
  montarGrupo(
    personagens,
    clones,
    ehJogadorDaCampanha,
    campanha,
    'jogador',
  ).map(jogador => ({
    ...jogador,
    uid: personagens.find(p => p.id === jogador.refId)?.uid ?? null,
  }));

// Campos de autor da mensagem para a persona escolhida (montarMensagem* em
// common/utils/chat.js completa e normaliza o resto).
export const autorDaPersona = (uid, persona) => ({
  uid,
  isMestre: true,
  persona: persona.persona,
  autorNome: persona.label,
  autorAvatar: persona.avatar,
});
