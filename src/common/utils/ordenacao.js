export const ORDEM_ASC = 'asc';
export const ORDEM_DESC = 'desc';

export const OPCOES_ORDENACAO_NOME = [
  { value: ORDEM_ASC, label: 'Nome (A a Z)' },
  { value: ORDEM_DESC, label: 'Nome (Z a A)' },
];

export const ordenarPorNome = (
  lista = [],
  ordem = ORDEM_ASC,
  campo = 'nome',
) => {
  const fator = ordem === ORDEM_DESC ? -1 : 1;
  return [...lista].sort(
    (a, b) =>
      fator *
      String(a?.[campo] || '').localeCompare(
        String(b?.[campo] || ''),
        'pt-BR',
        {
          sensitivity: 'base',
        },
      ),
  );
};
