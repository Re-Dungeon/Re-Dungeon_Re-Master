// Resolve o valor exibido nos cards de NPCs/Jogadores/Criaturas a partir de
// um doc de `personagens` (Re-Dungeon, schema não controlado pelo Re:Master).
// Prioridade: total já calculado pelo Re-Dungeon (`totais`/`atributosTotais`/
// `secundariosTotais`) > soma de base + bônus + extra + cultivo quando os
// componentes existem > campo cru no doc (que costuma ser só o valor base)
// como último fallback.
const ehValorPrimitivo = valor =>
  typeof valor === 'string' ||
  typeof valor === 'number' ||
  typeof valor === 'boolean';

// `cultivoBonus.{primarios|secundarios}.{atributo}` é um mapa
// `idDoReino -> bônus`; o total do cultivo para o atributo é a soma deles.
const somarNumeros = valor => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (valor && typeof valor === 'object') {
    return Object.values(valor).reduce(
      (total, item) => total + somarNumeros(item),
      0,
    );
  }
  return 0;
};

const bonusCultivo = (personagem, grupo, aliases) => {
  const alias = aliases.find(
    chave => personagem?.cultivoBonus?.[grupo]?.[chave] !== undefined,
  );
  return alias === undefined
    ? 0
    : somarNumeros(personagem.cultivoBonus[grupo][alias]);
};

const somaComponentesPrimarios = (personagem, aliases) => {
  for (const alias of aliases) {
    const base = personagem?.atributosBase?.[alias];
    if (typeof base === 'number') {
      const bonus = personagem?.atributosBonus?.[alias];
      const extra = personagem?.atributosExtra?.[alias];
      return (
        base +
        (typeof bonus === 'number' ? bonus : 0) +
        (typeof extra === 'number' ? extra : 0) +
        bonusCultivo(personagem, 'primarios', aliases)
      );
    }
  }
  return undefined;
};

export const resolverValorAtributoPrimario = (personagem, aliases) => {
  const totalDireto = aliases
    .map(
      alias =>
        personagem?.totais?.[alias] ?? personagem?.atributosTotais?.[alias],
    )
    .find(valor => typeof valor === 'number');
  if (totalDireto !== undefined) {
    return String(totalDireto);
  }

  const soma = somaComponentesPrimarios(personagem, aliases);
  if (soma !== undefined) {
    return String(soma);
  }

  const valorPrimitivo = aliases
    .flatMap(alias => [personagem?.atributos?.[alias], personagem?.[alias]])
    .find(ehValorPrimitivo);
  return valorPrimitivo !== undefined ? String(valorPrimitivo) : '—';
};

export const resolverValorAtributoSecundario = (personagem, aliases) => {
  const totalDireto = aliases
    .map(
      alias =>
        personagem?.secundariosTotais?.[alias] ?? personagem?.totais?.[alias],
    )
    .find(valor => typeof valor === 'number');
  if (totalDireto !== undefined) {
    return String(totalDireto);
  }

  const temComponentes = aliases.some(
    alias =>
      personagem?.secundariosBase?.[alias] !== undefined ||
      personagem?.atributosBonus?.[alias] !== undefined,
  );
  if (temComponentes) {
    const soma = aliases.reduce((acumulado, alias) => {
      const base = personagem?.secundariosBase?.[alias];
      const bonus = personagem?.atributosBonus?.[alias];
      return (
        acumulado +
        (typeof base === 'number' ? base : 0) +
        (typeof bonus === 'number' ? bonus : 0)
      );
    }, 0);
    return String(soma + bonusCultivo(personagem, 'secundarios', aliases));
  }

  return resolverValorAtributoPrimario(personagem, aliases);
};
