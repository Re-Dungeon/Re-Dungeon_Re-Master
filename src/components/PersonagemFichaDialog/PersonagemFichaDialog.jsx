import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SportsMmaOutlinedIcon from '@mui/icons-material/SportsMmaOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import {
  getPersonagemSubcolecao,
  getAptidao,
  getRaca,
  getClasse,
  getVeiaAstral,
} from 'service/storage';
import {
  resolverValorAtributoPrimario,
  resolverValorAtributoSecundario,
} from 'common/utils/atributosPersonagem';

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
  'raca',
  'classes',
  'idade',
  'powerCombat',
  'jogador',
  'jogadorInfo',
  'status',
  'statusMaximos',
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

// Mesmos aliases usados nos cards de NPCs/Criaturas/Jogadores
// (common/constants/atributosPersonagem.js) — o primeiro alias de cada item é
// a chave "canônica" sem acento usada em atributosBase/atributosBonus/atributosExtra.
const ATRIBUTOS_PRINCIPAIS_DIALOG = [
  {
    label: 'Força',
    icon: FitnessCenterOutlinedIcon,
    aliases: ['forca', 'for', 'forcaBase'],
  },
  {
    label: 'Inteligência',
    icon: PsychologyOutlinedIcon,
    aliases: ['inteligencia', 'int', 'inteligenciaBase'],
  },
  {
    label: 'Percepção',
    icon: VisibilityOutlinedIcon,
    aliases: ['percepcao', 'per', 'percepcaoBase'],
  },
  {
    label: 'Agilidade',
    icon: DirectionsRunOutlinedIcon,
    aliases: ['agilidade', 'agi', 'agilidadeBase'],
  },
  {
    label: 'Sorte',
    icon: AutoAwesomeOutlinedIcon,
    aliases: ['sorte', 'sor', 'sorteBase', 'sorBase'],
  },
  {
    label: 'Vitalidade',
    icon: FavoriteBorderOutlinedIcon,
    aliases: ['vitalidade', 'vit', 'vitalidadeBase'],
  },
];

const ATRIBUTOS_SECUNDARIOS_DIALOG = [
  {
    label: 'Ataque',
    icon: SportsMmaOutlinedIcon,
    aliases: ['ataque', 'ataqueBase', 'ataqueBonus'],
  },
  {
    label: 'Reação',
    icon: SpeedOutlinedIcon,
    aliases: ['reacao', 'reacaoBase', 'reacaoBonus'],
  },
  {
    label: 'Precisão',
    icon: VisibilityOutlinedIcon,
    aliases: ['precisao', 'precisaoBase', 'precisaoBonus'],
  },
  {
    label: 'Evasão',
    icon: ShieldOutlinedIcon,
    aliases: ['evasao', 'evasaoBase', 'evasaoBonus'],
  },
  {
    label: 'Prontidão Secundária',
    icon: BoltOutlinedIcon,
    aliases: ['prontidao', 'prontidaoBase', 'prontidaoBonus'],
  },
  {
    label: 'Defesa Secundária',
    icon: ShieldOutlinedIcon,
    aliases: ['defesa', 'defesaBase', 'defesaBonus'],
  },
];

// Caso legado: em alguns docs o campo bruto de Sorte vem como objeto
// ({ valor/atual/value }) em vez de número — resolverValorAtributoPrimario
// ignora objetos (só resolve primitivos ou soma numérica), então este
// fallback só entra quando o resolver genérico não encontrou nada.
const resolverValorSorte = (personagem, aliases) => {
  const resolvido = resolverValorAtributoPrimario(personagem, aliases);
  if (resolvido !== '—') return resolvido;

  const bruto = aliases
    .flatMap(alias => [personagem?.[alias], personagem?.atributosBase?.[alias]])
    .find(valor => typeof valor === 'object' && valor !== null);
  if (!bruto) return resolvido;

  const valorBruto = bruto.valor ?? bruto.atual ?? bruto.value;
  return valorBruto !== undefined ? String(valorBruto) : resolvido;
};

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
        background: 'rgba(25, 28, 37, 0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 2,
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

const AtributoCard = ({ icon: Icon, label, value }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      background: 'rgba(25, 28, 37, 0.96)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 0.75,
      minHeight: 112,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      width: '100%',
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        width: '100%',
      }}
    >
      {Icon && (
        <Icon
          sx={{ color: 'var(--color-accent)', fontSize: 20, flexShrink: 0 }}
        />
      )}
      <Typography
        variant="caption"
        sx={{
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          fontWeight: 700,
          fontSize: '0.65rem',
          lineHeight: 1.2,
          wordBreak: 'break-word',
        }}
      >
        {label}
      </Typography>
    </Box>
    <Typography
      variant="h5"
      sx={{
        color: 'var(--text-primary)',
        fontWeight: 700,
        fontSize: '1.65rem',
      }}
    >
      {typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      ehTimestamp(value) ? (
        typeof value === 'boolean' ? (
          String(value)
        ) : ehTimestamp(value) ? (
          formatarTimestamp(value)
        ) : (
          String(value)
        )
      ) : (
        <Box sx={{ width: '100%' }}>
          <CampoValor valor={value} />
        </Box>
      )}
    </Typography>
  </Paper>
);

AtributoCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
};

const StatusCard = ({ label, value, sublabel }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      background: 'rgba(25, 28, 37, 0.96)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
      minHeight: 100,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      width: '100%',
      maxWidth: { xs: '100%', md: 220 },
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="h4"
      sx={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '2rem' }}
    >
      {value}
    </Typography>
    {sublabel && (
      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
        {sublabel}
      </Typography>
    )}
  </Paper>
);

StatusCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sublabel: PropTypes.node,
};

const PanelCard = ({
  title,
  children,
  collapsible = false,
  isOpen = true,
  onToggle,
}) => (
  <Paper
    elevation={0}
    sx={{
      background: 'rgba(22, 25, 34, 0.96)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 2,
      p: 2,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: isOpen ? 1.5 : 0,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>
      {collapsible && (
        <IconButton
          size="small"
          onClick={onToggle}
          sx={{
            transition: 'transform 220ms ease',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-180deg)',
            color: 'var(--color-accent)',
            '&:hover': {
              background: 'rgba(255,255,255,0.06)',
            },
          }}
          aria-label={isOpen ? 'Retrair' : 'Expandir'}
        >
          <ExpandMoreIcon />
        </IconButton>
      )}
    </Box>
    {isOpen && children}
  </Paper>
);

PanelCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  collapsible: PropTypes.bool,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
};

const PersonagemFichaDialog = ({
  open,
  onClose,
  personagem,
  actions = null,
}) => {
  const [collapseStates, setCollapseStates] = useState({
    atributosTotais: false,
    atributosSecundarios: false,
    atributosDetalhados: false,
    infoJogador: false,
    detalhesAdicionais: false,
  });

  const toggleCollapse = painel => {
    setCollapseStates(prev => ({
      ...prev,
      [painel]: !prev[painel],
    }));
  };
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
            if (active) {
              setRacaNome(raca?.nome ?? null);
            }
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

  const statusValue = valor => valor?.atual ?? valor ?? '—';

  const construirMeta = () => {
    const meta = [];
    if (personagem?.idade) meta.push(personagem.idade);
    return meta.filter(Boolean).join(' · ');
  };

  const renderFichaPrincipal = () => {
    if (campos.length === 0) {
      return (
        <Typography
          variant="body2"
          sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
        >
          Sem campos adicionais nesta ficha.
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        {campos.map(([campo, valor]) => (
          <SecaoCampo key={campo} campo={campo} valor={valor} />
        ))}
      </Box>
    );
  };

  const statusCards = [
    {
      label: 'Fadiga',
      value: statusValue(personagem?.status?.fadiga),
      sublabel: `Máx ${personagem?.statusMaximos?.fadiga ?? '—'}`,
    },
    {
      label: 'HP',
      value: statusValue(personagem?.status?.hp),
      sublabel: `Máx ${personagem?.statusMaximos?.hp ?? '—'}`,
    },
    {
      label: 'Energia',
      value: statusValue(personagem?.status?.energia),
      sublabel: `Máx ${personagem?.statusMaximos?.energia ?? '—'}`,
    },
  ];

  const atributosPrincipais = ATRIBUTOS_PRINCIPAIS_DIALOG.map(
    ({ label, icon, aliases }) => ({
      label,
      icon,
      value:
        label === 'Sorte'
          ? resolverValorSorte(personagem, aliases)
          : resolverValorAtributoPrimario(personagem, aliases),
    }),
  );

  const atributosTotais = atributosPrincipais.map(({ label, icon, value }) => ({
    label,
    icon,
    value,
  }));

  const atributosSecundarios = ATRIBUTOS_SECUNDARIOS_DIALOG.map(
    ({ label, icon, aliases }) => ({
      label,
      icon,
      value: resolverValorAtributoSecundario(personagem, aliases),
    }),
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: 'min(1400px, calc(100vw - 48px))',
            maxHeight: '92vh',
            background: 'rgba(10, 12, 16, 0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(12, 14, 20, 0.96)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              color: 'var(--text-primary)',
              fontWeight: 800,
              letterSpacing: 0.4,
            }}
          >
            {personagem?.nome}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', mt: 0.5 }}
          >
            Ficha completa do personagem
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: 'var(--text-secondary)', p: 1.25 }}
          aria-label="Fechar ficha"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(12, 14, 20, 0.96)',
          position: 'sticky',
          top: '72px',
          zIndex: 9,
        }}
      >
        <Tabs
          value={aba}
          onChange={(_, valor) => setAba(valor)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 3,
            minHeight: 48,
            '& .MuiTab-root': {
              color: 'var(--text-secondary)',
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 700,
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
      </Box>

      <DialogContent
        dividers
        sx={{
          px: 3,
          py: 3,
          overflowY: 'auto',
          background: 'rgba(10, 12, 16, 1)',
        }}
      >
        {aba === 0 && (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: 'minmax(220px, 300px) minmax(0, 1fr)',
                alignItems: 'start',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.08)',
                  minHeight: 320,
                  background: 'rgba(20, 24, 34, 0.98)',
                }}
              >
                {personagem?.linkImagem ? (
                  <Box
                    component="img"
                    src={personagem.linkImagem}
                    alt={personagem.nome}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: 320,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 320,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <Typography sx={{ color: 'var(--text-muted)' }}>
                      Sem imagem
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(10,12,16,0.00) 0%, rgba(10,12,16,0.88) 100%)',
                  }}
                />
              </Paper>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    background: 'rgba(25, 28, 37, 0.96)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Identidade
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                  >
                    {personagem?.nome}
                  </Typography>
                  <Typography sx={{ color: 'var(--text-secondary)' }}>
                    {construirMeta() || 'Nenhuma informação disponível'}
                  </Typography>
                  {personagemResolvido?.raca && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        alignItems: 'baseline',
                      }}
                    >
                      <Typography sx={{ color: 'var(--text-muted)', mr: 0.5 }}>
                        Raça:
                      </Typography>
                      <Typography sx={{ color: 'var(--text-primary)' }}>
                        {personagemResolvido.raca}
                      </Typography>
                    </Box>
                  )}
                  {personagemResolvido?.classes && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        alignItems: 'baseline',
                      }}
                    >
                      <Typography sx={{ color: 'var(--text-muted)', mr: 0.5 }}>
                        Classes:
                      </Typography>
                      {personagemResolvido.classes.map((classe, index) => (
                        <Typography
                          key={`${classe}-${index}`}
                          sx={{ color: 'var(--text-primary)' }}
                        >
                          {classe}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    background: 'rgba(25, 28, 37, 0.96)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Power Combat
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SportsMmaOutlinedIcon
                      sx={{ color: 'var(--color-accent)', fontSize: 22 }}
                    />
                    <Typography
                      variant="h4"
                      sx={{ color: 'var(--text-primary)', fontWeight: 800 }}
                    >
                      {personagem?.powerCombat ?? '—'}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <PanelCard title="Atributos Principais">
                <Box
                  aria-label="Grade de atributos principais"
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: 'repeat(2, minmax(0, 1fr))',
                      sm: 'repeat(3, minmax(0, 1fr))',
                      md: 'repeat(6, minmax(0, 1fr))',
                    },
                  }}
                >
                  {atributosPrincipais.map(item => (
                    <AtributoCard
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </Box>
              </PanelCard>

              <PanelCard title="Status">
                <Box
                  aria-label="Grade de status"
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(3, minmax(0, 1fr))',
                    },
                    justifyItems: 'center',
                  }}
                >
                  {statusCards.map(item => (
                    <StatusCard
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      sublabel={item.sublabel}
                    />
                  ))}
                </Box>
              </PanelCard>
            </Box>

            <PanelCard
              title="Atributos Totais"
              collapsible
              isOpen={collapseStates.atributosTotais}
              onToggle={() => toggleCollapse('atributosTotais')}
            >
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                }}
              >
                {atributosTotais.map(item => (
                  <AtributoCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </Box>
            </PanelCard>

            <PanelCard
              title="Atributos Secundários"
              collapsible
              isOpen={collapseStates.atributosSecundarios}
              onToggle={() => toggleCollapse('atributosSecundarios')}
            >
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                }}
              >
                {atributosSecundarios.map(item => (
                  <AtributoCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </Box>
            </PanelCard>

            <PanelCard
              title="Atributos Detalhados"
              collapsible
              isOpen={collapseStates.atributosDetalhados}
              onToggle={() => toggleCollapse('atributosDetalhados')}
            >
              <Box
                sx={{
                  overflowX: 'auto',
                }}
              >
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    minWidth: 640,
                  }}
                >
                  <Box component="thead">
                    <Box component="tr">
                      <Box
                        component="th"
                        sx={{
                          textAlign: 'left',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          py: 1.5,
                          px: 1.5,
                        }}
                      >
                        Atributo
                      </Box>
                      <Box
                        component="th"
                        sx={{
                          textAlign: 'right',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          py: 1.5,
                          px: 1.5,
                        }}
                      >
                        Base
                      </Box>
                      <Box
                        component="th"
                        sx={{
                          textAlign: 'right',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          py: 1.5,
                          px: 1.5,
                        }}
                      >
                        Bônus
                      </Box>
                      <Box
                        component="th"
                        sx={{
                          textAlign: 'right',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          py: 1.5,
                          px: 1.5,
                        }}
                      >
                        Extra
                      </Box>
                      <Box
                        component="th"
                        sx={{
                          textAlign: 'right',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          py: 1.5,
                          px: 1.5,
                        }}
                      >
                        Total
                      </Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {ATRIBUTOS_PRINCIPAIS_DIALOG.map(({ label, aliases }) => {
                      // Primeiro alias é a chave canônica sem acento (ex.:
                      // 'forca') usada em atributosBase/Bonus/Extra — usar
                      // `label.toLowerCase()` aqui quebrava para labels
                      // acentuados como "Força"/"Inteligência"/"Percepção".
                      const [chave] = aliases;
                      const base = personagem?.atributosBase?.[chave] ?? '—';
                      const bonus = personagem?.atributosBonus?.[chave] ?? '—';
                      const extra = personagem?.atributosExtra?.[chave] ?? '—';
                      const total = resolverValorAtributoPrimario(
                        personagem,
                        aliases,
                      );
                      return (
                        <Box component="tr" key={label}>
                          <Box
                            component="td"
                            sx={{
                              py: 1.25,
                              px: 1.5,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {label}
                          </Box>
                          {[base, bonus, extra, total].map((valor, index) => (
                            <Box
                              key={index}
                              component="td"
                              sx={{
                                py: 1.25,
                                px: 1.5,
                                textAlign: 'right',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {String(valor)}
                            </Box>
                          ))}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </PanelCard>

            <PanelCard
              title="Informações do Jogador"
              collapsible
              isOpen={collapseStates.infoJogador}
              onToggle={() => toggleCollapse('infoJogador')}
            >
              {personagem?.jogador ? (
                <Box sx={{ display: 'grid', gap: 1.25 }}>
                  <Typography sx={{ color: 'var(--text-primary)' }}>
                    {personagem.jogador}
                  </Typography>
                  {personagem?.jogadorInfo && (
                    <Typography sx={{ color: 'var(--text-secondary)' }}>
                      {personagem.jogadorInfo}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography
                  sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
                >
                  Nenhuma informação disponível
                </Typography>
              )}
            </PanelCard>

            <PanelCard
              title="Detalhes Adicionais"
              collapsible
              isOpen={collapseStates.detalhesAdicionais}
              onToggle={() => toggleCollapse('detalhesAdicionais')}
            >
              {renderFichaPrincipal()}
            </PanelCard>
          </Box>
        )}

        {aba >= 1 && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {SUBCOLECOES.map(({ chave, label }, indice) => {
              if (aba !== indice + 1) return null;
              const estado = subcolecoes[chave] ?? {
                status: 'loading',
                docs: [],
              };
              return (
                <Box key={chave}>
                  {estado.status === 'loading' && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', py: 3 }}
                    >
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
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      {estado.docs.map(doc => (
                        <CardSubcolecaoDoc
                          key={doc.id}
                          doc={doc}
                          titulo={
                            chave === 'aptidoesAdquiridas'
                              ? aptidaoNomes[doc.id] === undefined
                                ? doc.id
                                : (aptidaoNomes[doc.id] ??
                                  'Aptidão não encontrada')
                              : null
                          }
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(12, 14, 20, 0.96)',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--text-secondary)',
            '&:hover': { color: 'var(--text-primary)' },
          }}
        >
          Fechar
        </Button>
        {actions}
      </DialogActions>
    </Dialog>
  );
};

PersonagemFichaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  personagem: PropTypes.object,
  actions: PropTypes.node,
};

export default PersonagemFichaDialog;
