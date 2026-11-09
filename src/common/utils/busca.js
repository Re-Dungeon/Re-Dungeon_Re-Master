// Normaliza para comparação: minúsculas e sem acento ("Ágata" casa com "agata").
// Filtra a faixa dos caracteres combinantes (U+0300–U+036F) por código, sem
// regex com esses caracteres soltos no código-fonte.
export const normalizarBusca = texto =>
  Array.from((texto ?? '').toString().toLowerCase().normalize('NFD'))
    .filter(caractere => {
      const codigo = caractere.codePointAt(0);
      return codigo < 0x0300 || codigo > 0x036f;
    })
    .join('')
    .trim();

// Filtra `lista` pelo(s) nome(s) que `obterNomes(item)` devolver (string ou
// array de strings), sem diferenciar acento nem caixa. Termo vazio devolve a
// própria lista.
export const filtrarPorNome = (
  lista = [],
  termo = '',
  obterNomes = item => item?.nome,
) => {
  const alvo = normalizarBusca(termo);
  if (!alvo) return lista;
  return lista.filter(item => {
    const nomes = [obterNomes(item)].flat();
    return nomes.some(nome => normalizarBusca(nome).includes(alvo));
  });
};
