import { normalizeEntityTypeName } from './notaUtils';

export const CATEGORIAS_TIPO_VINCULO = [
  'Familiar',
  'Afetivo',
  'Social',
  'Político',
  'Hierárquico',
  'Criador e criação',
  'Outro',
];

export const TIPOS_VINCULO_INICIAIS = [
  {
    name: 'Pai',
    inverseName: 'Filho(a)',
    category: 'Familiar',
    symmetric: false,
  },
  {
    name: 'Mãe',
    inverseName: 'Filho(a)',
    category: 'Familiar',
    symmetric: false,
  },
  {
    name: 'Filho',
    inverseName: 'Pai/Mãe',
    category: 'Familiar',
    symmetric: false,
  },
  {
    name: 'Filha',
    inverseName: 'Pai/Mãe',
    category: 'Familiar',
    symmetric: false,
  },
  {
    name: 'Irmão',
    inverseName: 'Irmão/Irmã',
    category: 'Familiar',
    symmetric: true,
  },
  {
    name: 'Irmã',
    inverseName: 'Irmão/Irmã',
    category: 'Familiar',
    symmetric: true,
  },
  {
    name: 'Cônjuge',
    inverseName: 'Cônjuge',
    category: 'Familiar',
    symmetric: true,
  },
  {
    name: 'Criador',
    inverseName: 'Criação',
    category: 'Criador e criação',
    symmetric: false,
  },
  {
    name: 'Criação',
    inverseName: 'Criador',
    category: 'Criador e criação',
    symmetric: false,
  },
  {
    name: 'Líder',
    inverseName: 'Membro',
    category: 'Hierárquico',
    symmetric: false,
  },
  {
    name: 'Membro',
    inverseName: 'Líder',
    category: 'Hierárquico',
    symmetric: false,
  },
  {
    name: 'Aliado',
    inverseName: 'Aliado',
    category: 'Social',
    symmetric: true,
  },
  { name: 'Rival', inverseName: 'Rival', category: 'Social', symmetric: true },
  {
    name: 'Mestre',
    inverseName: 'Aprendiz',
    category: 'Hierárquico',
    symmetric: false,
  },
  {
    name: 'Aprendiz',
    inverseName: 'Mestre',
    category: 'Hierárquico',
    symmetric: false,
  },
];

export const validarReferenciaVinculo = ({
  origem,
  destino,
  universoOrigem,
  universoDestino,
}) => {
  if (!origem || !destino) return { ok: false, erro: 'REFERENCIA_INCOMPLETA' };
  if (origem === destino) return { ok: false, erro: 'AUTORRELACIONAMENTO' };
  if (
    universoOrigem &&
    universoDestino &&
    String(universoOrigem) !== String(universoDestino)
  ) {
    return { ok: false, erro: 'UNIVERSO_INCOMPATIVEL' };
  }
  return { ok: true };
};

export const derivarRelacaoInversa = tipo => {
  if (!tipo) return '';
  if (tipo.symmetric) return tipo.inverseName || tipo.name || '';
  return tipo.inverseName || '';
};

export const impedirDuplicidadeTipoVinculo = (tipos, nome, universoId) => {
  const normalizedName = normalizeEntityTypeName(nome);
  if (!normalizedName) return false;
  return (Array.isArray(tipos) ? tipos : []).some(
    tipo =>
      String(tipo?.universoId ?? '') === String(universoId) &&
      normalizeEntityTypeName(tipo?.name ?? tipo?.nome ?? '') ===
        normalizedName,
  );
};

const nomeOpcao = (item, campos = []) => {
  for (const campo of campos) {
    if (typeof item?.[campo] === 'string' && item[campo].trim())
      return item[campo].trim();
  }
  return 'Sem nome';
};

export const montarOpcoesVinculo = ({
  campanhaId,
  mestreId,
  universoId,
  notas = [],
  personagens = [],
  npcs = [],
  jogadores = [],
  criaturas = [],
  origemId,
}) => {
  const opcoes = [];

  (Array.isArray(notas) ? notas : []).forEach(nota => {
    if (!nota?.id || String(nota.id) === String(origemId)) return;
    if (nota.universoId && String(nota.universoId) !== String(universoId))
      return;
    opcoes.push({
      key: `rmNotas:${nota.id}`,
      destinoId: nota.id,
      destinoColecao: 'rmNotas',
      nome: nomeOpcao(nota, ['titulo', 'nome', 'title']),
      tipo: nomeOpcao(nota, ['tipo', 'categoria', 'Tipo']),
      grupo: 'NOTAS',
      imagem:
        nota.imagemPerfil ||
        nota.imagemUrl ||
        nota.linkImagem ||
        nota.foto ||
        nota.image ||
        null,
      universoId: nota.universoId || universoId,
      origemCampanha: false,
    });
  });

  const clones = [
    ...(Array.isArray(npcs) ? npcs : []).map(item => ({
      ...item,
      tipoClone: 'NPC',
      grupoClone: 'NPCs',
    })),
    ...(Array.isArray(jogadores) ? jogadores : []).map(item => ({
      ...item,
      tipoClone: 'Personagem Jogável',
      grupoClone: 'PERSONAGENS JOGÁVEIS',
    })),
    ...(Array.isArray(criaturas) ? criaturas : []).map(item => ({
      ...item,
      tipoClone: 'Criatura',
      grupoClone: 'CRIATURAS',
    })),
  ];

  const origensClonadas = new Set();
  clones.forEach(clone => {
    const origemPersonagemId = clone?.origemPersonagemId;
    if (!origemPersonagemId) return;
    if (campanhaId && clone.campanhaId && String(clone.campanhaId) !== String(campanhaId))
      return;
    if (mestreId && clone.mestreId && String(clone.mestreId) !== String(mestreId))
      return;
    if (clone.universoId && String(clone.universoId) !== String(universoId))
      return;

    const origemChave = String(origemPersonagemId);
    if (origensClonadas.has(origemChave)) return;
    origensClonadas.add(origemChave);

    opcoes.push({
      key: `clone:${clone.tipoClone}:${origemChave}`,
      destinoId: clone.id,
      origemPersonagemId,
      destinoColecao: `rmCampanhas/clones/${clone.tipoClone}`,
      nome: nomeOpcao(clone, ['nome', 'titulo']),
      tipo: clone.tipoClone,
      grupo: clone.grupoClone,
      imagem: clone.linkImagem || clone.imagemPerfil || clone.imagemUrl || null,
      universoId: clone.universoId || universoId,
      origemCampanha: true,
    });
  });

  (Array.isArray(personagens) ? personagens : []).forEach(personagem => {
    if (!personagem?.id || String(personagem.id) === String(origemId)) return;
    if (
      personagem.universo &&
      String(personagem.universo) !== String(universoId)
    )
      return;
    if (origensClonadas.has(String(personagem.id))) return;
    opcoes.push({
      key: `personagens:${personagem.id}`,
      destinoId: personagem.id,
      destinoColecao: 'personagens',
      nome: nomeOpcao(personagem, ['nome', 'titulo', 'Nome']),
      tipo: nomeOpcao(personagem, ['tipo', 'Tipo']),
      grupo: 'PERSONAGENS',
      imagem:
        personagem.linkImagem ||
        personagem.imagemPerfil ||
        personagem.imagemUrl ||
        null,
      universoId: personagem.universo || universoId,
      origemCampanha: false,
    });
  });

  const ordemGrupo = {
    'PERSONAGENS JOGÁVEIS': 0,
    NPCs: 1,
    CRIATURAS: 2,
    NOTAS: 3,
    PERSONAGENS: 4,
  };

  return opcoes
    .filter(
      (opcao, index, lista) =>
        lista.findIndex(item => item.key === opcao.key) === index,
    )
    .sort((a, b) => {
      const diferencaGrupo =
        (ordemGrupo[a.grupo] ?? 99) - (ordemGrupo[b.grupo] ?? 99);
      if (diferencaGrupo !== 0) return diferencaGrupo;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
};
