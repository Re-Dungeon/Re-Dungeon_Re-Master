import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import EntityViewDialog from 'components/EntityViewDialog/EntityViewDialog';
import {
  getPersonagemSubcolecao,
  getAptidao,
  getRaca,
  getClasse,
  getVeiaAstral,
} from 'service/storage';

// Campos já exibidos pelo EntityViewDialog (nome/imagem/descrição) ou que são
// metadados internos do Re-Dungeon/Re:Master — não repetidos na ficha abaixo.
const CAMPOS_OCULTOS = new Set([
  'id',
  'uid',
  'tipo',
  'universo',
  'campanhas',
  'createdAt',
  'updatedAt',
  'nome',
  'linkImagem',
  'descricao',
]);

// Subcoleções conhecidas da ficha de personagem — o match `{subcolecao}` do
// firestore.rules é um wildcard que cobre qualquer nome, então não precisa de
// mudança de regra para adicionar uma nova aqui. A leitura só funciona se o
// mestre logado for o dono do personagem no Re-Dungeon — para NPCs de outro
// usuário a aba mostra "Sem acesso".
const SUBCOLECOES = [
  { chave: 'aptidoesAdquiridas', label: 'Aptidões Adquiridas' },
  { chave: 'arts', label: 'Artes' },
  { chave: 'historicoSorte', label: 'Histórico de Sorte' },
  { chave: 'variantes', label: 'Variantes' },
  { chave: 'nucleos', label: 'Núcleos' },
  { chave: 'itensInventario', label: 'Itens (Inventário)' },
  { chave: 'materiaisInventario', label: 'Materiais (Inventário)' },
  { chave: 'receitasInventario', label: 'Receitas (Inventário)' },
];

const humanizarLabel = campo =>
  campo
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());

const ehVazio = valor =>
  valor === null ||
  valor === undefined ||
  valor === '' ||
  (Array.isArray(valor) && valor.length === 0) ||
  (typeof valor === 'object' &&
    !Array.isArray(valor) &&
    Object.keys(valor).length === 0);

const rotuloSx = {
  color: 'var(--text-muted)',
  display: 'block',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  mb: 0.25,
};

const MESES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

// Detecta um Timestamp do Firestore (instância real, com `toDate()`, ou já
// desserializado como `{ seconds, nanoseconds }`) para formatar como data em
// vez de mostrar o objeto cru.
const ehTimestamp = valor =>
  valor !== null &&
  typeof valor === 'object' &&
  (typeof valor.toDate === 'function' ||
    (typeof valor.seconds === 'number' &&
      typeof valor.nanoseconds === 'number'));

// Formato pedido: "29 de julho de 2026 às 22:34:44 UTC-3" — dia/mês/ano por
// extenso em pt-BR, hora local com segundos e o offset UTC do navegador.
const formatarTimestamp = valor => {
  const data =
    typeof valor.toDate === 'function'
      ? valor.toDate()
      : new Date(valor.seconds * 1000 + valor.nanoseconds / 1e6);
  const dia = data.getDate();
  const mes = MESES_PT[data.getMonth()];
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  const segundo = String(data.getSeconds()).padStart(2, '0');
  const offsetHoras = -data.getTimezoneOffset() / 60;
  const sinalOffset = offsetHoras >= 0 ? '+' : '-';
  return `${dia} de ${mes} de ${ano} às ${hora}:${minuto}:${segundo} UTC${sinalOffset}${Math.abs(offsetHoras)}`;
};

// Re:Master não conhece o schema completo da ficha (ela é mantida pelo
// Re-Dungeon e pode ter qualquer estrutura), então este renderizador é
// genérico: valores simples viram texto, listas de texto viram chips, listas
// de objetos e objetos aninhados viram grades de label/valor recursivas — sem
// nunca cair de volta para um bloco de JSON cru.
const CampoValor = ({ valor }) => {
  if (
    typeof valor === 'string' ||
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  ) {
    return (
      <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
        {String(valor)}
      </Typography>
    );
  }

  if (ehTimestamp(valor)) {
    return (
      <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
        {formatarTimestamp(valor)}
      </Typography>
    );
  }

  if (Array.isArray(valor)) {
    const todosPrimitivos = valor.every(
      item => item === null || typeof item !== 'object',
    );
    if (todosPrimitivos) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {valor.map((item, indice) => (
            <Chip
              key={`${item}-${indice}`}
              label={String(item)}
              size="small"
              sx={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          ))}
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {valor.map((item, indice) => (
          <Paper
            key={`item-${indice}`}
            elevation={0}
            sx={{
              p: 1.25,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 1.5,
            }}
          >
            <CampoValor valor={item} />
          </Paper>
        ))}
      </Box>
    );
  }

  const entradas = Object.entries(valor).filter(([, v]) => !ehVazio(v));
  if (entradas.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
      >
        —
      </Typography>
    );
  }
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 1.25,
      }}
    >
      {entradas.map(([campo, v]) => (
        <Box key={campo}>
          <Typography component="span" sx={rotuloSx}>
            {humanizarLabel(campo)}
          </Typography>
          <CampoValor valor={v} />
        </Box>
      ))}
    </Box>
  );
};

CampoValor.propTypes = {
  valor: PropTypes.any,
};

const SecaoCampo = ({ campo, valor }) => (
  <Box sx={{ mb: 2 }}>
    <Typography
      variant="subtitle2"
      sx={{
        color: 'var(--color-accent)',
        fontWeight: 700,
        mb: 0.75,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: '0.72rem',
      }}
    >
      {humanizarLabel(campo)}
    </Typography>
    <CampoValor valor={valor} />
  </Box>
);

SecaoCampo.propTypes = {
  campo: PropTypes.string.isRequired,
  valor: PropTypes.any,
};

const CardSubcolecaoDoc = ({ doc, titulo = null }) => {
  const campos = Object.fromEntries(
    Object.entries(doc).filter(([campo]) => campo !== 'id'),
  );
  const temCampos = Object.keys(campos).length > 0;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 1.5,
      }}
    >
      {titulo && (
        <Typography
          variant="subtitle2"
          sx={{
            color: 'var(--text-primary)',
            fontWeight: 700,
            mb: temCampos ? 1 : 0,
          }}
        >
          {titulo}
        </Typography>
      )}
      {(temCampos || !titulo) && <CampoValor valor={campos} />}
    </Paper>
  );
};

CardSubcolecaoDoc.propTypes = {
  doc: PropTypes.object.isRequired,
  titulo: PropTypes.string,
};

/**
 * Ficha completa (somente leitura) de um personagem do Re-Dungeon, aberta a
 * partir da tela de NPCs da campanha. Aba "Ficha" mostra os campos do
 * documento principal; uma aba por subcoleção conhecida (aptidões, artes,
 * histórico de sorte) busca os dados sob demanda quando o diálogo abre.
 */
const PersonagemFichaDialog = ({
  open,
  onClose,
  personagem,
  actions = null,
}) => {
  const [aba, setAba] = useState(0);
  const [subcolecoes, setSubcolecoes] = useState({});
  const [aptidaoNomes, setAptidaoNomes] = useState({});
  const [racaNome, setRacaNome] = useState();
  const [classeNomes, setClasseNomes] = useState({});
  const [noVeiaAstralNomes, setNoVeiaAstralNomes] = useState({});

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setAba(0);
      setAptidaoNomes({});
      setRacaNome(undefined);
      setClasseNomes({});
      setNoVeiaAstralNomes({});
    });
    return () => {
      active = false;
    };
  }, [open, personagem?.id]);

  // `raca` (id único), `classes` (array de ids) e `veiasAstrais.nosDesbloqueados`
  // (array de ids) guardam só o id da entidade referenciada — resolve para o
  // nome em vez de mostrar o id cru na aba Ficha.
  useEffect(() => {
    if (!open || !personagem) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;

      if (personagem.raca) {
        getRaca(personagem.raca)
          .then(raca => {
            if (active) setRacaNome(raca?.nome ?? null);
          })
          .catch(() => {
            if (active) setRacaNome(null);
          });
      }

      const classesIds = Array.isArray(personagem.classes)
        ? personagem.classes
        : [];
      classesIds.forEach(id => {
        getClasse(id)
          .then(classe => {
            if (active)
              setClasseNomes(prev => ({ ...prev, [id]: classe?.nome ?? null }));
          })
          .catch(() => {
            if (active) setClasseNomes(prev => ({ ...prev, [id]: null }));
          });
      });

      const nosIds = Array.isArray(personagem.veiasAstrais?.nosDesbloqueados)
        ? personagem.veiasAstrais.nosDesbloqueados
        : [];
      nosIds.forEach(id => {
        getVeiaAstral(id)
          .then(no => {
            if (active)
              setNoVeiaAstralNomes(prev => ({
                ...prev,
                [id]: no?.nome ?? null,
              }));
          })
          .catch(() => {
            if (active) setNoVeiaAstralNomes(prev => ({ ...prev, [id]: null }));
          });
      });
    });
    return () => {
      active = false;
    };
  }, [open, personagem]);

  useEffect(() => {
    if (!open || !personagem) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setSubcolecoes(
        Object.fromEntries(
          SUBCOLECOES.map(({ chave }) => [
            chave,
            { status: 'loading', docs: [] },
          ]),
        ),
      );
      SUBCOLECOES.forEach(({ chave }) => {
        getPersonagemSubcolecao(personagem.id, chave)
          .then(docs => {
            if (active)
              setSubcolecoes(prev => ({
                ...prev,
                [chave]: { status: 'ok', docs },
              }));
          })
          .catch(() => {
            if (active)
              setSubcolecoes(prev => ({
                ...prev,
                [chave]: { status: 'erro', docs: [] },
              }));
          });
      });
    });
    return () => {
      active = false;
    };
  }, [open, personagem]);

  // O id de cada doc em aptidoesAdquiridas é o mesmo id do doc correspondente
  // em `aptidoes` — resolve para o nome em vez de mostrar o id cru na aba.
  useEffect(() => {
    const estado = subcolecoes.aptidoesAdquiridas;
    if (!estado || estado.status !== 'ok' || estado.docs.length === 0)
      return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      Promise.all(
        estado.docs.map(item =>
          getAptidao(item.id)
            .then(aptidao => [item.id, aptidao?.nome ?? null])
            .catch(() => [item.id, null]),
        ),
      ).then(pares => {
        if (active) setAptidaoNomes(Object.fromEntries(pares));
      });
    });
    return () => {
      active = false;
    };
  }, [subcolecoes.aptidoesAdquiridas]);

  // Enquanto o nome ainda não resolveu (undefined) mostra o id como
  // placeholder; se resolveu e não achou (null), mostra uma mensagem clara
  // em vez de voltar a exibir o id.
  const resolverNome = (nomes, id) =>
    nomes[id] === undefined ? id : (nomes[id] ?? 'Não encontrado(a)');

  const personagemResolvido = personagem && {
    ...personagem,
    raca: personagem.raca
      ? racaNome === undefined
        ? personagem.raca
        : (racaNome ?? 'Raça não encontrada')
      : personagem.raca,
    classes: Array.isArray(personagem.classes)
      ? personagem.classes.map(id => resolverNome(classeNomes, id))
      : personagem.classes,
    veiasAstrais: personagem.veiasAstrais && {
      ...personagem.veiasAstrais,
      nosDesbloqueados: Array.isArray(personagem.veiasAstrais.nosDesbloqueados)
        ? personagem.veiasAstrais.nosDesbloqueados.map(id =>
            resolverNome(noVeiaAstralNomes, id),
          )
        : personagem.veiasAstrais.nosDesbloqueados,
    },
  };

  const campos = personagemResolvido
    ? Object.entries(personagemResolvido).filter(
        ([campo, valor]) => !CAMPOS_OCULTOS.has(campo) && !ehVazio(valor),
      )
    : [];

  return (
    <EntityViewDialog
      open={open}
      onClose={onClose}
      titulo={personagem?.nome}
      subtitulo="Ficha completa do personagem"
      imagem={personagem?.linkImagem}
      descricao={personagem?.descricao}
      actions={actions}
    >
      <Tabs
        value={aba}
        onChange={(_, valor) => setAba(valor)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          minHeight: 36,
          borderBottom: '1px solid var(--border-primary)',
          '& .MuiTab-root': {
            color: 'var(--text-secondary)',
            minHeight: 36,
            textTransform: 'none',
          },
          '& .Mui-selected': { color: 'var(--color-accent) !important' },
          '& .MuiTabs-indicator': { background: 'var(--color-accent)' },
        }}
      >
        <Tab label="Ficha" />
        {SUBCOLECOES.map(({ chave, label }) => (
          <Tab
            key={chave}
            label={
              subcolecoes[chave]?.status === 'ok' &&
              subcolecoes[chave].docs.length > 0
                ? `${label} (${subcolecoes[chave].docs.length})`
                : label
            }
          />
        ))}
      </Tabs>

      {aba === 0 &&
        (campos.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
          >
            Sem campos adicionais nesta ficha.
          </Typography>
        ) : (
          campos.map(([campo, valor]) => (
            <SecaoCampo key={campo} campo={campo} valor={valor} />
          ))
        ))}

      {SUBCOLECOES.map(({ chave, label }, indice) => {
        if (aba !== indice + 1) return null;
        const estado = subcolecoes[chave] ?? { status: 'loading', docs: [] };
        return (
          <Box key={chave}>
            {estado.status === 'loading' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress
                  size={22}
                  sx={{ color: 'var(--color-accent)' }}
                />
              </Box>
            )}
            {estado.status === 'erro' && (
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
              >
                Sem acesso a &quot;{label}&quot; — ficha pertence a outro
                usuário do Re-Dungeon.
              </Typography>
            )}
            {estado.status === 'ok' && estado.docs.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
              >
                Nenhum registro em &quot;{label}&quot;.
              </Typography>
            )}
            {estado.status === 'ok' && estado.docs.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {estado.docs.map(doc => (
                  <CardSubcolecaoDoc
                    key={doc.id}
                    doc={doc}
                    titulo={
                      chave === 'aptidoesAdquiridas'
                        ? aptidaoNomes[doc.id] === undefined
                          ? doc.id
                          : (aptidaoNomes[doc.id] ?? 'Aptidão não encontrada')
                        : null
                    }
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </EntityViewDialog>
  );
};

PersonagemFichaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  personagem: PropTypes.object,
  actions: PropTypes.node,
};

export default PersonagemFichaDialog;
