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
  getOrigem,
  getCondicoes,
  getUsuarioNome,
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
  'infoJogador',
  'usuario',
  'createdBy',
  'creator',
  'owner',
  'user',
  'titulo',
  'afiliacao',
  'statusNarrativo',
  'background',
  'notasAdicionais',
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
  { chave: 'nucleos', label: 'Núcleos' },
  { chave: 'arts', label: 'Artes' },
  { chave: 'variantes', label: 'Variantes' },
  { chave: 'historicoSorte', label: 'Histórico de Sorte' },
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

const normalizarTextoValor = valor => {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  if (typeof valor === 'string') {
    const texto = valor.trim();
    return texto || null;
  }

  if (typeof valor === 'number' || typeof valor === 'boolean') {
    return String(valor);
  }

  if (Array.isArray(valor)) {
    const texto = valor
      .map(item => normalizarTextoValor(item))
      .filter(Boolean)
      .join(', ');
    return texto || null;
  }

  if (typeof valor === 'object') {
    const entradas = Object.entries(valor).filter(([, item]) => !ehVazio(item));
    if (entradas.length === 0) return null;
    const texto = entradas
      .map(([chave, item]) => `${humanizarLabel(chave)}: ${normalizarTextoValor(item)}`)
      .filter(Boolean)
      .join(' • ');
    return texto || null;
  }

  return String(valor);
};

const normalizarValorSimples = valor => {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  if (typeof valor === 'object' && !Array.isArray(valor)) {
    const candidato = [
      'valor',
      'atual',
      'value',
      'nivel',
      'level',
      'xp',
      'experiencia',
      'pontosPrincipais',
      'pontosPrincipaisDisponiveis',
      'pontos_principais_disponiveis',
      'pontosSecundarios',
      'pontosSecundariosDisponiveis',
      'pontos_secundarios_disponiveis',
    ].find(chave => !ehVazio(valor[chave]));

    if (candidato) {
      return normalizarTextoValor(valor[candidato]);
    }
  }

  return normalizarTextoValor(valor);
};

const ehVazio = valor =>
  valor === null ||
  valor === undefined ||
  valor === '' ||
  (Array.isArray(valor) && valor.length === 0) ||
  (typeof valor === 'object' &&
    !Array.isArray(valor) &&
    Object.keys(valor).length === 0);

const resolverValorInfoJogador = (fontes, aliases) => {
  for (const fonte of fontes) {
    if (ehVazio(fonte)) continue;

    if (typeof fonte === 'string' || typeof fonte === 'number' || typeof fonte === 'boolean') {
      return normalizarTextoValor(fonte) ?? null;
    }

    if (Array.isArray(fonte)) {
      continue;
    }

    if (typeof fonte === 'object') {
      for (const alias of aliases) {
        const valorAlias = fonte[alias];
        if (!ehVazio(valorAlias)) {
          return normalizarTextoValor(valorAlias) ?? null;
        }
      }

      const aliasesAninhados = [
        'infoJogador',
        'informacoesJogador',
        'playerInfo',
        'jogadorInfo',
        'playerInformation',
        'informacoes',
        'dadosJogador',
        'dados',
      ];

      for (const aliasAninhado of aliasesAninhados) {
        const valorAninhado = fonte[aliasAninhado];
        if (!ehVazio(valorAninhado)) {
          const valorResolvido = resolverValorInfoJogador([valorAninhado], aliases);
          if (!ehVazio(valorResolvido)) {
            return valorResolvido;
          }
        }
      }
    }
  }

  return null;
};

const rotuloSx = {
  color: 'var(--text-muted)',
  display: 'block',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  mb: 0.25,
};

const textoScrollSx = {
  color: 'var(--text-primary)',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
  maxHeight: 'calc(1.7em * 6)',
  overflowY: 'auto',
  pr: 0.75,
  fontSize: '0.95rem',
};

const painelInfoJogadorSx = {
  p: { xs: 1.5, sm: 1.75 },
  background:
    'linear-gradient(135deg, rgba(14, 18, 28, 0.98), rgba(8, 10, 16, 0.98))',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2.25,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 12px 30px rgba(0, 0, 0, 0.16)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(90deg, rgba(0, 120, 255, 0.18), transparent 42%, rgba(0, 217, 255, 0.1))',
    pointerEvents: 'none',
  },
};

const chipInfoJogadorSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.6,
  px: 1,
  py: 0.4,
  borderRadius: 999,
  background: 'rgba(0, 120, 255, 0.16)',
  color: 'var(--color-accent)',
  border: '1px solid rgba(0, 120, 255, 0.28)',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
};

const valorInfoJogadorSx = {
  color: 'var(--text-primary)',
  fontWeight: 700,
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
  fontSize: '0.96rem',
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
  const formatted = `${dia} de ${mes} de ${ano} às ${hora}:${minuto}:${segundo} UTC${sinalOffset}${Math.abs(offsetHoras)}`;
  return formatted;
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
      <Typography
        variant="body2"
        sx={{
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
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

const MiniAtributoCard = ({ label, value, Icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1,
      background: 'rgba(25, 28, 37, 0.96)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 1.5,
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
      alignItems: 'center',
      textAlign: 'center',
      minWidth: 88,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {Icon && (
        <Icon sx={{ color: 'var(--color-accent)', fontSize: 16 }} />
      )}
    </Box>
    <Typography
      variant="caption"
      sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.6 }}
    >
      {label}
    </Typography>
    <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
      {String(value)}
    </Typography>
  </Paper>
);

MiniAtributoCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  Icon: PropTypes.elementType,
};

const SecaoCampo = ({ campo, valor }) => {

  // Se o valor for um objeto simples com várias chaves, apresentar como
  // mini-cards (painel de atributos) para melhorar a legibilidade.
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    const entradas = Object.entries(valor).filter(([, v]) => !ehVazio(v));
    if (entradas.length === 0) {
      return (
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
          <Typography sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</Typography>
        </Box>
      );
    }

    // Quando o grupo é tipicamente uma coleção de atributos, mostramos uma
    // grid de mini-cards; isso melhora a densidade de informação sem tocar
    // nos valores.
    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'var(--color-accent)',
            fontWeight: 700,
            mb: 1,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontSize: '0.72rem',
          }}
        >
          {humanizarLabel(campo)}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
          }}
        >
          {entradas.map(([k, v]) => (
            <MiniAtributoCard
              key={k}
              label={humanizarLabel(k)}
              value={(() => {
                if (ehTimestamp(v)) return formatarTimestamp(v);
                if (typeof v === 'object' && v !== null && (v.atual || v.valor || v.value)) {
                  return v.atual ?? v.valor ?? v.value;
                }
                return Array.isArray(v) ? v.join(', ') : String(v);
              })()}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // Fallback para valores primitivos/arrays: usar o render padrão.
  return (
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
};

SecaoCampo.propTypes = {
  campo: PropTypes.string.isRequired,
  valor: PropTypes.any,
};
const SmallPanel = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.25,
      background: 'rgba(18,22,32,0.85)',
      border: '1px solid rgba(212,175,55,0.06)',
      borderRadius: 1.5,
    }}
  >
    <Typography
      variant="caption"
      sx={{ color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}
    >
      {title}
      <Box component="span" sx={{ display: 'none' }}>{String(title).normalize('NFD').replace(/[\u0300-\u036f]/g, '')}</Box>
    </Typography>
    {children}
  </Paper>
);

SmallPanel.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const extrairCampoHistorico = (doc, aliases) => {
  for (const alias of aliases) {
    const valor = doc?.[alias];
    if (valor !== undefined && valor !== null && valor !== '') {
      return valor;
    }
  }
  return null;
};

const formatarTextoHistorico = valor => {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  if (typeof valor === 'string') {
    return valor.trim() || null;
  }

  if (typeof valor === 'number' || typeof valor === 'boolean') {
    return String(valor);
  }

  if (ehTimestamp(valor)) {
    return formatarTimestamp(valor);
  }

  if (Array.isArray(valor)) {
    return valor.join(', ');
  }

  if (typeof valor === 'object') {
    const entradas = Object.entries(valor).slice(0, 4);
    return entradas.length > 0
      ? entradas.map(([chave, item]) => `${chave}: ${String(item)}`).join(' • ')
      : null;
  }

  return String(valor);
};

const resolverValorNucleo = (doc, aliases) => {
  for (const alias of aliases) {
    const valor = doc?.[alias];
    if (valor !== undefined && valor !== null && valor !== '') {
      return formatarTextoHistorico(valor);
    }
  }
  return null;
};

const resolverQuantidadeArtes = doc => {
  const candidates = [doc?.artes, doc?.artesRelacionadas, doc?.arts, doc?.artesIds, doc?.artesAssociadas, doc?.artesRelacionadasIds];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.length;
    }
    if (candidate && typeof candidate === 'object') {
      return Object.keys(candidate).length;
    }
  }
  return 0;
};

const NucleoCard = ({ doc }) => {
  const nome = resolverValorNucleo(doc, ['nome', 'titulo', 'tituloNucleo', 'nomeNucleo']) ?? doc?.id ?? 'Núcleo';
  const imagem = resolveImagemAsset(doc);
  const tipo = resolverValorNucleo(doc, ['tipo', 'tipoNucleo', 'categoria', 'categoriaNucleo']) ?? '—';
  const essencia = resolverValorNucleo(doc, ['essencia', 'essenciaNucleo', 'conteudo', 'textoEssencia']) ?? 'Sem essência cadastrada.';
  const descricao = resolverValorNucleo(doc, ['descricao', 'descricaoNucleo', 'descricaoDetalhada', 'resumo']) ?? null;
  const bonus = resolverValorNucleo(doc, ['bonus', 'bonusNucleo', 'beneficio', 'efeito']) ?? null;
  const criadoEm = resolverValorNucleo(doc, ['createdAt', 'dataCriacao', 'dataCriado', 'criadoEm']) ?? null;
  const atualizadoEm = resolverValorNucleo(doc, ['updatedAt', 'dataAtualizacao', 'atualizadoEm']) ?? null;
  const quantidadeArtes = resolverQuantidadeArtes(doc);

  const camposExtras = [
    descricao ? { label: 'Descrição', valor: descricao } : null,
    bonus ? { label: 'Bônus', valor: bonus } : null,
  ].filter(Boolean);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 1.75 },
        background: 'linear-gradient(135deg, rgba(15, 20, 30, 0.97), rgba(8, 11, 18, 0.98))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 2.25,
        boxShadow: '0 14px 34px rgba(0, 0, 0, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0, 120, 255, 0.16), transparent 45%, rgba(0, 217, 255, 0.08))',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: imagem ? 'transparent' : 'rgba(0, 120, 255, 0.16)', border: '1px solid rgba(0, 120, 255, 0.25)', overflow: 'hidden', flexShrink: 0 }}>
            {imagem ? (
              <Box component="img" src={imagem} alt={nome} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <AutoAwesomeOutlinedIcon sx={{ color: 'var(--color-accent)', fontSize: 20 }} />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 800, lineHeight: 1.3, wordBreak: 'break-word' }}>
              {nome}
            </Typography>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.82rem', mt: 0.25 }}>
              Tipo: {tipo}
            </Typography>
            <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.78rem', mt: 0.2 }}>
              Essência: {resolverValorNucleo(doc, ['essencia', 'essenciaNucleo', 'conteudo', 'textoEssencia']) ?? '—'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.5, borderRadius: 999, background: 'rgba(0, 120, 255, 0.16)', border: '1px solid rgba(0, 120, 255, 0.24)', color: 'var(--text-primary)', fontSize: '0.76rem', fontWeight: 700, flexShrink: 0 }}>
          <Typography component="span" sx={{ fontSize: '0.76rem', fontWeight: 700, lineHeight: 1 }}>
            {`📜 ${quantidadeArtes} art(s)`}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, display: 'grid', gap: 1 }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'var(--color-accent)', letterSpacing: '0.16em', fontSize: '0.62rem', textTransform: 'uppercase', mb: 0.4, display: 'block' }}>
            Essência
          </Typography>
          <Box sx={{ p: 1.1, borderRadius: 1.5, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 'calc(1.7em * 6)', overflowY: 'auto', pr: 0.75 }}>
            <Typography sx={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: '0.94rem' }}>
              {essencia}
            </Typography>
          </Box>
        </Box>

        {camposExtras.length > 0 && (
          <Box sx={{ display: 'grid', gap: 0.9 }}>
            {camposExtras.map(item => (
              <Box
                key={item.label}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  ...(item.label === 'Descrição'
                    ? { maxHeight: '5.8rem', overflowY: 'auto', pr: 0.75 }
                    : {}),
                }}
              >
                <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.14em', fontSize: '0.58rem', textTransform: 'uppercase', display: 'block', mb: 0.4 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: '0.9rem' }}>
                  {item.valor}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {(criadoEm || atualizadoEm) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 0.25 }}>
            {criadoEm ? (
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                Criado em: {criadoEm}
              </Typography>
            ) : null}
            {atualizadoEm ? (
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                Atualizado em: {atualizadoEm}
              </Typography>
            ) : null}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

NucleoCard.propTypes = {
  doc: PropTypes.object.isRequired,
};

const CardSubcolecaoDoc = ({ doc, titulo = null, subcolecaoKey = null }) => {
  const campos = Object.fromEntries(
    Object.entries(doc).filter(([campo]) => campo !== 'id'),
  );
  const temCampos = Object.keys(campos).length > 0;
  // Estado para abrir/fechar o dialog de habilidades (usa hooks sempre no topo do componente)
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [receitaDialogOpen, setReceitaDialogOpen] = useState(false);

  if (subcolecaoKey === 'historicoSorte') {
    const tipo = formatarTextoHistorico(
      extrairCampoHistorico(doc, ['tipo', 'tipoAcao', 'acao', 'acaoEvento', 'tipoEvento', 'evento']),
    );
    const valor = formatarTextoHistorico(
      extrairCampoHistorico(doc, ['resultado', 'valor', 'valorFinal', 'valorSorte', 'resultadoSorte', 'sorte', 'total']),
    );
    const descricao = formatarTextoHistorico(
      extrairCampoHistorico(doc, ['descricao', 'descricaoEvento', 'detalhes', 'observacao', 'observacoes', 'resumo', 'nota']),
    );
    const timestamp = formatarTextoHistorico(
      extrairCampoHistorico(doc, ['createdAt', 'updatedAt', 'data', 'timestamp', 'momento', 'dataHora', 'dataRegistro', 'dataCriacao']),
    );

    const camposExtras = Object.entries(campos).filter(([campo]) => ![
      'tipo',
      'tipoAcao',
      'acao',
      'acaoEvento',
      'tipoEvento',
      'evento',
      'resultado',
      'valor',
      'valorFinal',
      'valorSorte',
      'resultadoSorte',
      'sorte',
      'total',
      'descricao',
      'descricaoEvento',
      'detalhes',
      'observacao',
      'observacoes',
      'resumo',
      'nota',
      'createdAt',
      'updatedAt',
      'data',
      'timestamp',
      'momento',
      'dataHora',
      'dataRegistro',
      'dataCriacao',
    ].includes(campo));

    const valorNegativo = typeof valor === 'string' && valor.startsWith('-');

    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.35, sm: 1.5 },
          background: 'linear-gradient(180deg, rgba(18, 21, 29, 0.96) 0%, rgba(12, 15, 22, 0.98) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.12)',
          borderRadius: 2,
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.25, minWidth: 0 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {tipo ?? 'Evento'}
            </Typography>
            {descricao ? (
              <Typography
                sx={{
                  color: 'var(--text-secondary)',
                  mt: 0.7,
                  fontSize: '0.94rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                {descricao}
              </Typography>
            ) : null}
          </Box>
          {valor ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                flexShrink: 0,
                minWidth: 72,
                px: 0.9,
                py: 0.7,
                borderRadius: 1.25,
                background: valorNegativo ? 'rgba(255, 107, 107, 0.12)' : 'rgba(111, 45, 168, 0.16)',
                border: valorNegativo ? '1px solid rgba(255, 107, 107, 0.15)' : '1px solid rgba(111, 45, 168, 0.2)',
              }}
            >
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Resultado
              </Typography>
              <Typography
                sx={{
                  color: valorNegativo ? '#ff8990' : 'var(--color-accent)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  lineHeight: 1.1,
                  mt: 0.25,
                }}
              >
                {valor}
              </Typography>
            </Box>
          ) : null}
        </Box>
        {timestamp ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              color: 'var(--text-muted)',
              fontSize: '0.77rem',
              pt: 0.25,
            }}
          >
            <Box component="span" aria-hidden sx={{ fontSize: '0.92rem' }}>
              ⏱
            </Box>
            <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.45 }}>
              {timestamp}
            </Typography>
          </Box>
        ) : null}
        {camposExtras.length > 0 && (
          <Box
            sx={{
              pt: 0.75,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.6,
            }}
          >
            {camposExtras.slice(0, 4).map(([campo, valorExtra]) => (
              <Box
                key={campo}
                sx={{
                  px: 0.75,
                  py: 0.4,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.67rem', lineHeight: 1.25 }}>
                  {humanizarLabel(campo)}: {String(valorExtra)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    );
  }

  // Layout visual exclusivo para itens do inventário (apenas apresentação)
  if (subcolecaoKey === 'itensInventario') {
    const nome = doc.nome ?? doc.name ?? doc.titulo ?? doc.title ?? doc.id;
    const imagem = resolveImagemAsset(doc);
    const raridade =
      doc.raridade ?? doc.rarity ?? doc.rarityLevel ?? doc.rarity_level ?? null;
    const tipo = doc.tipo ?? doc.type ?? doc.categoria ?? null;
    const nivel = doc.nivel ?? doc.level ?? doc.nivelAtual ?? doc.nivel_atual ?? null;

    function localizarValor(obj, aliases = []) {
      if (!obj || typeof obj !== 'object') return null;
      const tryValue = v => (v === null || v === undefined || v === '' ? null : v);

      // 1) tentativas diretas por alias
      for (const a of aliases) {
        if (Object.prototype.hasOwnProperty.call(obj, a)) {
          const v = tryValue(obj[a]);
          if (v != null) return v;
        }
      }

      // 2) procurar em campos aninhados (duas camadas)
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === 'object') {
          for (const a of aliases) {
            if (Object.prototype.hasOwnProperty.call(val, a)) {
              const v = tryValue(val[a]);
              if (v != null) return v;
            }
          }
        }
      }

      // 3) procurar por chaves que contenham parte do alias (case-insensitive)
      const text = aliases.join(' ').toLowerCase();
      for (const [k, v] of Object.entries(obj)) {
        if (k.toLowerCase().includes(text) && tryValue(v) != null) return v;
      }

      return null;
    }

    const scanForDice = o => {
      const diceRe = /\b\d+d\d+\b/i;
      const check = val => {
        if (typeof val === 'string' && diceRe.test(val)) return val.match(diceRe)[0];
        if (Array.isArray(val)) {
          for (const it of val) {
            const r = check(it);
            if (r) return r;
          }
        }
        if (val && typeof val === 'object') {
          for (const v of Object.values(val)) {
            const r = check(v);
            if (r) return r;
          }
        }
        return null;
      };
      return check(o);
    };

    const scanForNumericByKey = (o, keyPatterns = []) => {
      const patterns = keyPatterns.map(k => k.toLowerCase());
      const isNumeric = v => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(String(v).replace(/[,\s]/g, '').replace(',', '.'))));

      const checkObj = obj => {
        for (const [k, v] of Object.entries(obj)) {
          const lk = k.toLowerCase();
          for (const p of patterns) {
            if (lk.includes(p) && isNumeric(v)) return v;
          }
          if (v && typeof v === 'object') {
            const nested = checkObj(v);
            if (nested != null) return nested;
          }
        }
        return null;
      };
      return checkObj(o);
    };

    let roll =
      localizarValor(doc, ['roll', 'rol', 'rolagem', 'rolde']) ??
      localizarValor(doc, ['formula', 'dice', 'dado']) ??
      null;
    if (!roll) roll = scanForDice(doc) ?? null;

    const extra = localizarValor(doc, ['extra', 'extras', 'extraInfo', 'bonus']) ?? null;

    let quantidade =
      localizarValor(doc, ['quantidade', 'qtd', 'qty', 'quant', 'amount']) ?? null;
    if (quantidade == null) quantidade = scanForNumericByKey(doc, ['quant', 'qtd', 'quantity', 'amount']);

    let unitario =
      localizarValor(doc, ['unitario', 'va4Unitario', 'unitPrice', 'precoUnitario', 'valor', 'price']) ?? null;
    if (unitario == null) unitario = scanForNumericByKey(doc, ['unit', 'unitario', 'valor', 'price', 'preco']);

    let total =
      localizarValor(doc, ['total', 'valorTotal', 'priceTotal', 'preco', 'valor']) ?? null;
    if (total == null) total = scanForNumericByKey(doc, ['total', 'valor_total', 'preco_total', 'price_total', 'price']);

    // helper: tenta converter string/number em Number (aceita vírgula como decimal)
    const toNumber = v => {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') return v;
      const s = String(v).replace(/\s+/g, '');
      // trocar vírgula decimal para ponto, remover outros milhares
      const normalized = s.replace(/\.(?=\d{3,})/g, '').replace(',', '.');
      const n = Number(normalized);
      return Number.isFinite(n) ? n : null;
    };

    // Se total ausente e puder calcular com quantidade * unitario, faz fallback
    const qtdNum = toNumber(quantidade);
    const unitNum = toNumber(unitario);
    if ((total === null || total === undefined || total === '—') && qtdNum != null && unitNum != null) {
      const calc = qtdNum * unitNum;
      // formata como 2 casas no formato pt-BR
      try {
        total = calc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } catch {
        total = String(calc.toFixed(2));
      }
    }

    // Debug temporário removido.

    // --- Habilidades (skill) detection
    const detectSkillsFromKeys = o => {
      if (!o || typeof o !== 'object') return null;
      const patterns = ['habil', 'skill', 'ability', 'aptid', 'aptida', 'art', 'arts', 'arte'];
      for (const [k, v] of Object.entries(o)) {
        const lk = String(k).toLowerCase();
        for (const p of patterns) {
          if (lk.includes(p) && v != null && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) {
            return v;
          }
        }
      }
      return null;
    };

    const habilidadesRaw = localizarValor(doc, ['habilidades', 'habilidade', 'skills', 'abilities', 'aptidoes', 'aptidoesRelacionadas', 'arts', 'artsRelacionadas']) ??
      detectSkillsFromKeys(doc) ??
      doc?.habilidades ?? doc?.habilidade ?? doc?.skills ?? doc?.abilities ?? null;

    const hasSkillStructure = o => {
      if (!o) return false;
      if (Array.isArray(o)) {
        return o.some(item => hasSkillStructure(item));
      }
      if (typeof o === 'object') {
        const keys = Object.keys(o).map(k => k.toLowerCase());
        if (keys.includes('nome') || keys.includes('name') || keys.includes('titulo') || keys.includes('title') || keys.includes('descricao') || keys.includes('description')) return true;
        return Object.values(o).some(v => typeof v === 'object' && hasSkillStructure(v));
      }
      return false;
    };

    

    const habilidadesArray = (() => {
      if (!habilidadesRaw) return null;
      if (Array.isArray(habilidadesRaw)) return habilidadesRaw;
      if (typeof habilidadesRaw === 'string') return [habilidadesRaw];
      if (typeof habilidadesRaw === 'object') {
        const vals = Object.values(habilidadesRaw).filter(v => v !== undefined && v !== null && v !== '');
        return vals.length > 0 ? vals : [habilidadesRaw];
      }
      return [habilidadesRaw];
    })();

    const isSpecialSkill = hb => {
      if (!hb) return false;
      const nome = String(hb?.nome ?? hb?.name ?? hb?.titulo ?? hb?.title ?? '').toLowerCase();
      if (nome.includes('especial') || nome.includes('especiale') || nome.includes('especials')) return true;
      const tipoH = String(hb?.tipo ?? hb?.category ?? hb?.categoria ?? hb?.type ?? '').toLowerCase();
      if (tipoH.includes('especial') || tipoH.includes('especialidade') || tipoH.includes('especials')) return true;
      if (hb?.especial === true) return true;
      const tags = hb?.tags ?? hb?.etiquetas ?? hb?.labels ?? null;
      if (Array.isArray(tags) && tags.some(t => String(t).toLowerCase().includes('especial'))) return true;
      // fallback: if description explicitly mentions 'Especial' in a heading
      const desc = String(hb?.descricao ?? hb?.description ?? hb?.texto ?? hb?.detalhes ?? '').toLowerCase();
      if (desc.includes('habilidades especiais') || desc.includes('habilidade especial') || desc.includes('especial')) return true;
      return false;
    };

    const specialSkills = habilidadesArray ? habilidadesArray.filter(isSpecialSkill) : [];

    const showSkillButton = Boolean((habilidadesArray && habilidadesArray.length > 0) || (specialSkills && specialSkills.length > 0) || detectSkillsFromKeys(doc) || hasSkillStructure(doc));

    const rarityBg = (() => {
      const r = (String(raridade ?? '')).toLowerCase();
      if (r.includes('comum')) return 'rgba(255,255,255,0.03)';
      if (r.includes('incomum') || r.includes('uncommon')) return 'rgba(0,120,255,0.08)';
      if (r.includes('raro') || r.includes('rare')) return 'rgba(111,45,168,0.12)';
      if (r.includes('épico') || r.includes('epico') || r.includes('epic')) return 'rgba(212,175,55,0.12)';
      if (r.includes('lendario') || r.includes('lendário') || r.includes('legend')) return 'rgba(255,140,0,0.12)';
      return 'rgba(255,255,255,0.03)';
    })();

    const rarityBorder = (() => {
      const r = (String(raridade ?? '')).toLowerCase();
      if (r.includes('raro')) return 'rgba(111,45,168,0.28)';
      if (r.includes('épico') || r.includes('epico')) return 'rgba(212,175,55,0.28)';
      if (r.includes('incomum')) return 'rgba(0,120,255,0.28)';
      if (r.includes('lendario') || r.includes('lendário')) return 'rgba(255,140,0,0.28)';
      return 'rgba(255,255,255,0.06)';
    })();

    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.25,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 2,
          overflow: 'hidden',
          maxWidth: 400,
          width: '100%',
          minHeight: 400,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            sx={{
              borderRadius: 1.5,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            <Box
              sx={{
                height: { xs: 160, sm: 220 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02))',
              }}
            >
              {imagem ? (
                <Box
                  component="img"
                  src={imagem}
                  alt={nome}
                  loading="lazy"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Typography sx={{ color: 'var(--text-muted)' }}>Sem imagem</Typography>
                  </Box>
              )}
            </Box>

            <Box sx={{ position: 'relative', px: 1, py: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography
                sx={{
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  width: '100%',
                }}
                title={String(nome)}
              >
                {normalizarTextoValor(nome) ?? '—'}
              </Typography>

              {raridade ? (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    px: 1,
                    py: 0.35,
                    borderRadius: 999,
                    background: rarityBg,
                    border: `1px solid ${rarityBorder}`,
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    flexShrink: 0,
                  }}
                >
                  {String(raridade)}
                </Box>
              ) : null}
            </Box>
          </Box>

          <Box sx={{ px: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.75 }}>
            <Box>
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Tipo</Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(tipo) ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Nível</Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(nivel) ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Roll</Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(roll) ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Extra</Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(extra) ?? '—'}</Typography>
            </Box>
          </Box>

          <Box sx={{ px: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Quantidade</Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>{normalizarTextoValor(quantidade) ?? '—'}</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Unitário</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(unitario) ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Total</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(total) ?? '—'}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 1 }}>
              {showSkillButton ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSkillDialogOpen(true)}
                  >
                    Skill
                  </Button>
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
        {/* Dialog de Habilidades */}
        <Dialog
          open={skillDialogOpen}
          onClose={() => setSkillDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
            <Typography sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Habilidades Especiais</Typography>
            <IconButton onClick={() => setSkillDialogOpen(false)} aria-label="fechar dialogo de habilidades">
              <CloseIcon sx={{ color: 'var(--text-primary)' }} />
            </IconButton>
          </Box>
          <DialogContent dividers>
            {(() => {
              const skillsToShow = (specialSkills && specialSkills.length > 0)
                ? specialSkills
                : (habilidadesArray && habilidadesArray.length > 0 ? habilidadesArray : []);

              if (!skillsToShow || skillsToShow.length === 0) {
                return <Typography sx={{ color: 'var(--text-secondary)' }}>Nenhuma habilidade especial cadastrada.</Typography>;
              }

              return skillsToShow.map((hb, idx) => {
                const nomeH = hb?.nome ?? hb?.name ?? hb?.titulo ?? hb?.title ?? (typeof hb === 'string' ? hb : `Habilidade ${idx + 1}`);
                const descH = hb?.descricao ?? hb?.description ?? hb?.texto ?? hb?.detalhes ?? null;
                const pruned = (hb && typeof hb === 'object') ? { ...hb } : hb;
                if (pruned && typeof pruned === 'object') {
                  delete pruned.nome;
                  delete pruned.name;
                  delete pruned.titulo;
                  delete pruned.title;
                  delete pruned.descricao;
                  delete pruned.description;
                  delete pruned.texto;
                  delete pruned.detalhes;
                }
                const hasPrunedContent = pruned && typeof pruned === 'object' && Object.keys(pruned).length > 0;
                return (
                  <Paper key={idx} elevation={0} sx={{ p: 1.25, mb: 1.25, background: 'linear-gradient(180deg, rgba(32,20,45,0.95), rgba(18,16,24,0.95))', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 1.5 }}>
                    <Typography sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 0.5 }}>{String(nomeH)}</Typography>
                    {descH ? (
                      <Typography sx={{ color: 'var(--text-secondary)', mb: 0.75, textAlign: 'justify', lineHeight: 1.6 }}>{normalizarTextoValor(descH)}</Typography>
                    ) : null}
                    {hasPrunedContent ? <CampoValor valor={pruned} /> : null}
                  </Paper>
                );
              });
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSkillDialogOpen(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  }

  // Layout visual para Materiais (Inventário) — similar ao de itens, adaptado
  if (subcolecaoKey === 'materiaisInventario') {
    // helpers locais (mirrored da versão para itens) — mantidos aqui para escopo limitado
    function localizarValor(obj, aliases = []) {
      if (!obj || typeof obj !== 'object') return null;
      const tryValue = v => (v === null || v === undefined || v === '' ? null : v);

      for (const a of aliases) {
        if (Object.prototype.hasOwnProperty.call(obj, a)) {
          const v = tryValue(obj[a]);
          if (v != null) return v;
        }
      }

      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === 'object') {
          for (const a of aliases) {
            if (Object.prototype.hasOwnProperty.call(val, a)) {
              const v = tryValue(val[a]);
              if (v != null) return v;
            }
          }
        }
      }

      const text = aliases.join(' ').toLowerCase();
      for (const [k, v] of Object.entries(obj)) {
        if (k.toLowerCase().includes(text) && tryValue(v) != null) return v;
      }

      return null;
    }

    const scanForNumericByKey = (o, keyPatterns = []) => {
      const patterns = keyPatterns.map(k => k.toLowerCase());
      const isNumeric = v => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(String(v).replace(/[,\s]/g, '').replace(',', '.'))));

      const checkObj = obj => {
        for (const [k, v] of Object.entries(obj)) {
          const lk = k.toLowerCase();
          for (const p of patterns) {
            if (lk.includes(p) && isNumeric(v)) return v;
          }
          if (v && typeof v === 'object') {
            const nested = checkObj(v);
            if (nested != null) return nested;
          }
        }
        return null;
      };
      return checkObj(o);
    };
    const nome = doc.nome ?? doc.name ?? doc.titulo ?? doc.title ?? doc.id;
    const imagem = resolveImagemAsset(doc);
    const raridade = localizarValor(doc, ['raridade', 'rarity', 'rarityLevel', 'rarity_level']) ?? null;

    const tipo = localizarValor(doc, ['tipo', 'type', 'categoria', 'material', 'materialType']) ?? null;
    const pureza = localizarValor(doc, ['pureza', 'purity', 'grade', 'qualidade']) ?? null;
    let taxaDrop = localizarValor(doc, ['taxaDrop', 'dropRate', 'taxa', 'chanceDrop', 'drop']) ?? null;
    if (taxaDrop == null) taxaDrop = scanForNumericByKey(doc, ['drop', 'taxa', 'chance', 'rate']);

    let valorMercado = localizarValor(doc, ['valorMercado', 'marketValue', 'valor', 'price', 'value']) ?? null;
    if (valorMercado == null) valorMercado = scanForNumericByKey(doc, ['valor', 'price', 'market', 'value']);

    let quantidade = localizarValor(doc, ['quantidade', 'qtd', 'qty', 'amount', 'quantity']) ?? null;
    if (quantidade == null) quantidade = scanForNumericByKey(doc, ['quant', 'qtd', 'amount', 'quantity']);

    return (
      <>
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 2,
            overflow: 'hidden',
            maxWidth: 320,
            width: '100%',
            minHeight: 300,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <Box sx={{ height: { xs: 120, sm: 160 }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02))' }}>
                {imagem ? (
                  <Box component="img" src={imagem} alt={nome} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Typography sx={{ color: 'var(--text-muted)' }}>Sem imagem</Typography>
                  </Box>
                )}
              </Box>

              {raridade ? (
                <Box sx={{ position: 'absolute', right: 8, top: 8, px: 1.05, py: 0.4, borderRadius: 1.25, background: 'linear-gradient(135deg, rgba(255,200,80,0.98), rgba(255,120,35,0.98))', border: '1px solid rgba(0,0,0,0.12)', color: '#091018', fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 10px 28px rgba(0,0,0,0.48)', zIndex: 6 }}>
                  {String(raridade)}
                </Box>
              ) : null}

              <Box sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.98rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }} title={String(nome)}>
                  {normalizarTextoValor(nome) ?? '—'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ px: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.75 }}>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Tipo</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(tipo) ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Pureza</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(pureza) ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Taxa de Drop</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(taxaDrop) ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Valor de Mercado</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(valorMercado) ?? '—'}</Typography>
              </Box>
            </Box>

            <Box sx={{ px: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Quantidade</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>{normalizarTextoValor(quantidade) ?? '—'}</Typography>
              </Box>
              {/* botão para Descrição/Propriedades */}
              <Box sx={{ mt: 1 }}>
                {(() => {
                  const descricaoRaw = localizarValor(doc, ['descricao', 'description', 'texto', 'desc', 'detalhes']) ?? doc?.descricao ?? doc?.description ?? null;
                  const detectProps = o => {
                    if (!o || typeof o !== 'object') return null;
                    const patterns = ['propr', 'prop', 'property', 'props', 'atrib', 'attr', 'detalh'];
                    for (const [k, v] of Object.entries(o)) {
                      const lk = String(k).toLowerCase();
                      for (const p of patterns) {
                        if (lk.includes(p) && v != null && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) return v;
                      }
                    }
                    return null;
                  };
                  const propsRaw = detectProps(doc) ?? localizarValor(doc, ['propriedades', 'propriedade', 'properties', 'property', 'props', 'attributes', 'atributos']) ?? null;
                  const hasDesc = descricaoRaw && descricaoRaw !== '';
                  const hasProps = propsRaw && (Array.isArray(propsRaw) ? propsRaw.length > 0 : Object.keys(propsRaw || {}).length > 0);
                  if (hasDesc || hasProps) {
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button size="small" variant="outlined" onClick={() => setMaterialDialogOpen(true)}>Descrição</Button>
                      </Box>
                    );
                  }
                  return null;
                })()}
              </Box>
            </Box>
          </Box>
        </Paper>

        <Dialog open={materialDialogOpen} onClose={() => setMaterialDialogOpen(false)} fullWidth maxWidth="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
            <Typography sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Descrição e Propriedades</Typography>
            <IconButton onClick={() => setMaterialDialogOpen(false)} aria-label="fechar dialogo de material"><CloseIcon sx={{ color: 'var(--text-primary)' }} /></IconButton>
          </Box>
          <DialogContent dividers>
            {(() => {
              const descricaoRaw = localizarValor(doc, ['descricao', 'description', 'texto', 'desc', 'detalhes']) ?? doc?.descricao ?? doc?.description ?? null;
              const detectProps = o => {
                if (!o || typeof o !== 'object') return null;
                const patterns = ['propr', 'prop', 'property', 'props', 'atrib', 'attr', 'detalh'];
                for (const [k, v] of Object.entries(o)) {
                  const lk = String(k).toLowerCase();
                  for (const p of patterns) {
                    if (lk.includes(p) && v != null && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) return v;
                  }
                }
                return null;
              };
              const propsRaw = detectProps(doc) ?? localizarValor(doc, ['propriedades', 'propriedade', 'properties', 'property', 'props', 'attributes', 'atributos']) ?? null;
              const propsArray = (() => {
                if (!propsRaw) return null;
                if (Array.isArray(propsRaw)) return propsRaw;
                if (typeof propsRaw === 'object') return Object.entries(propsRaw).map(([k, v]) => ({ nome: k, descricao: v }));
                return [propsRaw];
              })();

              return (
                <>
                  {descricaoRaw ? (
                    <Box sx={{ mb: 1.25 }}>
                      <Typography sx={{ color: 'var(--color-accent)', fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>Descrição</Typography>
                      <Typography sx={{ color: 'var(--text-secondary)', textAlign: 'justify', lineHeight: 1.6 }}>{normalizarTextoValor(descricaoRaw)}</Typography>
                    </Box>
                  ) : null}

                  <Typography sx={{ color: 'var(--color-accent)', fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>Propriedades</Typography>
                  {propsArray && propsArray.length > 0 ? (
                    propsArray.map((p, i) => {
                      const isObj = p && typeof p === 'object';
                      const title = isObj ? (p.nome ?? p.label ?? null) : null;
                      const desc = isObj ? (p.descricao ?? p.valor ?? p.value ?? '') : p;
                      return (
                        <Paper key={i} elevation={0} sx={{ p: 1, mb: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 1.25 }}>
                          {title ? <Typography sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 0.5 }}>{String(title)}</Typography> : null}
                          <Typography sx={{ color: 'var(--text-secondary)', textAlign: 'justify' }}>{normalizarTextoValor(desc ?? '')}</Typography>
                        </Paper>
                      );
                    })
                  ) : (
                    <Typography sx={{ color: 'var(--text-secondary)' }}>Nenhuma propriedade cadastrada.</Typography>
                  )}
                </>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMaterialDialogOpen(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Layout visual para Receitas (Inventário) — similar ao de itens/materiais
  if (subcolecaoKey === 'receitasInventario') {
    function localizarValor(obj, aliases = []) {
      if (!obj || typeof obj !== 'object') return null;
      const tryValue = v => (v === null || v === undefined || v === '' ? null : v);

      for (const a of aliases) {
        if (Object.prototype.hasOwnProperty.call(obj, a)) {
          const v = tryValue(obj[a]);
          if (v != null) return v;
        }
      }

      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === 'object') {
          for (const a of aliases) {
            if (Object.prototype.hasOwnProperty.call(val, a)) {
              const v = tryValue(val[a]);
              if (v != null) return v;
            }
          }
        }
      }

      const text = aliases.join(' ').toLowerCase();
      for (const [k, v] of Object.entries(obj)) {
        if (k.toLowerCase().includes(text) && tryValue(v) != null) return v;
      }

      return null;
    }

    const scanForNumericByKey = (o, keyPatterns = []) => {
      const patterns = keyPatterns.map(k => k.toLowerCase());
      const isNumeric = v => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(String(v).replace(/[,\s]/g, '').replace(',', '.'))));

      const checkObj = obj => {
        for (const [k, v] of Object.entries(obj)) {
          const lk = k.toLowerCase();
          for (const p of patterns) {
            if (lk.includes(p) && isNumeric(v)) return v;
          }
          if (v && typeof v === 'object') {
            const nested = checkObj(v);
            if (nested != null) return nested;
          }
        }
        return null;
      };
      return checkObj(o);
    };

    const nome = doc.nome ?? doc.name ?? doc.titulo ?? doc.title ?? doc.id;
    const imagem = resolveImagemAsset(doc);
    const raridade = localizarValor(doc, ['raridade', 'rarity', 'rarityLevel', 'rarity_level']) ?? null;

    const tipo = localizarValor(doc, ['tipo', 'type', 'categoria', 'categoriaReceita']) ?? null;
    // Detectar valores de compra/venda caso o documento armazene preços
    const valorCompra = localizarValor(doc, ['valorCompra', 'valor_compra', 'precoCompra', 'preco_compra', 'buyPrice', 'priceBuy', 'preco']) ?? null;
    const valorVenda = localizarValor(doc, ['valorVenda', 'valor_venda', 'precoVenda', 'preco_venda', 'sellPrice', 'priceSell']) ?? null;
    // Manter rendimento/tempo/dificuldade como fallback quando presentes
    const rendimento = localizarValor(doc, ['rendimento', 'yield', 'produces', 'output']) ?? null;
    const tempo = localizarValor(doc, ['tempo', 'time', 'duracao', 'duration']) ?? null;

    const detectIngredientes = o => {
      if (!o || typeof o !== 'object') return null;
      const keys = Object.keys(o).map(k => String(k).toLowerCase());
      for (const k of keys) {
        if (k.includes('ingred') || k.includes('ingredient') || k.includes('component')) return o[k];
      }
      return null;
    };
    const ingredientesRaw = detectIngredientes(doc) ?? localizarValor(doc, ['ingredientes', 'ingredients', 'componentes', 'components']) ?? null;
    const ingredientesArray = (() => {
      if (!ingredientesRaw) return null;
      if (Array.isArray(ingredientesRaw)) return ingredientesRaw;
      if (typeof ingredientesRaw === 'object') return Object.entries(ingredientesRaw).map(([k, v]) => ({ nome: k, quantidade: v }));
      return [ingredientesRaw];
    })();

    let quantidade = localizarValor(doc, ['quantidade', 'qtd', 'qty', 'amount', 'quantity']) ?? null;
    if (quantidade == null) quantidade = scanForNumericByKey(doc, ['quant', 'qtd', 'amount', 'quantity']);

    return (
      <>
        <Paper elevation={0} sx={{ p: 1.25, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 2, overflow: 'hidden', maxWidth: 320, width: '100%', minHeight: 300 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <Box sx={{ height: { xs: 120, sm: 160 }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02))' }}>
                {imagem ? (
                  <Box component="img" src={imagem} alt={nome} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Typography sx={{ color: 'var(--text-muted)' }}>Sem imagem</Typography>
                  </Box>
                )}
              </Box>

              {raridade ? (
                <Box sx={{ position: 'absolute', right: 8, top: 8, px: 1.05, py: 0.4, borderRadius: 1.25, background: 'linear-gradient(135deg, rgba(255,200,80,0.98), rgba(255,120,35,0.98))', border: '1px solid rgba(0,0,0,0.12)', color: '#091018', fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 10px 28px rgba(0,0,0,0.48)', zIndex: 6 }}>
                  {String(raridade)}
                </Box>
              ) : null}

              <Box sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.98rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }} title={String(nome)}>
                  {normalizarTextoValor(nome) ?? '—'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ px: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.75 }}>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Tipo</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(tipo) ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Valor Compra</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(valorCompra ?? rendimento) ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>Valor Venda</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{normalizarTextoValor(valorVenda ?? tempo) ?? '—'}</Typography>
              </Box>
              {/* Rendimento removido por solicitação */}
            </Box>

            <Box sx={{ px: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Quantidade</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>{normalizarTextoValor(quantidade) ?? '—'}</Typography>
              </Box>
              {/* botão para Descrição/Ingredientes */}
              <Box sx={{ mt: 1 }}>
                {(() => {
                  const hasDesc = localizarValor(doc, ['descricao', 'description', 'texto', 'desc', 'detalhes']) ?? doc?.descricao ?? doc?.description ?? null;
                  const hasIngr = ingredientesArray && ingredientesArray.length > 0;
                  if (hasDesc || hasIngr) {
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button size="small" variant="outlined" onClick={() => setReceitaDialogOpen(true)}>Descrição</Button>
                      </Box>
                    );
                  }
                  return null;
                })()}
              </Box>
            </Box>
          </Box>
        </Paper>

        <Dialog open={receitaDialogOpen} onClose={() => setReceitaDialogOpen(false)} fullWidth maxWidth="sm">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
            <Typography sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Descrição e Ingredientes</Typography>
            <IconButton onClick={() => setReceitaDialogOpen(false)} aria-label="fechar dialogo de receita"><CloseIcon sx={{ color: 'var(--text-primary)' }} /></IconButton>
          </Box>
          <DialogContent dividers>
            {(() => {
              const descricaoRaw = localizarValor(doc, ['descricao', 'description', 'texto', 'desc', 'detalhes']) ?? doc?.descricao ?? doc?.description ?? null;
              return (
                <>
                  {descricaoRaw ? (
                    <Box sx={{ mb: 1.25 }}>
                      <Typography sx={{ color: 'var(--color-accent)', fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>Descrição</Typography>
                      <Typography sx={{ color: 'var(--text-secondary)', textAlign: 'justify', lineHeight: 1.6 }}>{normalizarTextoValor(descricaoRaw)}</Typography>
                    </Box>
                  ) : null}

                  <Typography sx={{ color: 'var(--color-accent)', fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>Ingredientes</Typography>
                  {ingredientesArray && ingredientesArray.length > 0 ? (
                    ingredientesArray.map((ing, i) => (
                      <Paper key={i} elevation={0} sx={{ p: 1, mb: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 1.5 }}>
                        <Typography sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 0.5 }}>{ing?.nome ?? ing?.label ?? `Ingrediente ${i + 1}`}</Typography>
                        <Typography sx={{ color: 'var(--text-secondary)' }}>{String(ing?.quantidade ?? ing?.amount ?? ing?.qtd ?? ing)}</Typography>
                      </Paper>
                    ))
                  ) : (
                    <Typography sx={{ color: 'var(--text-secondary)' }}>Nenhum ingrediente listado.</Typography>
                  )}
                </>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReceitaDialogOpen(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  
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
  subcolecaoKey: PropTypes.string,
};

const ArtCard = ({ doc, titulo = null, condicaoReferencias = {} }) => {
  const [activeTab, setActiveTab] = useState('descricao');
  const nome = titulo ?? doc.nome ?? doc.id;
  const imagem = resolveImagemAsset(doc);
  const tipo = doc.tipo ?? doc.tipoArte ?? doc.categoria ?? null;
  const categorias = Array.isArray(doc.categoria)
    ? doc.categoria
    : doc.categoria
    ? [doc.categoria]
    : [];
  const recarga = doc.recarga ?? doc.cooldown ?? doc.recarrega ?? 'N/D';
  // Heurística robusta para extrair o campo de ação (pode vir com vários nomes
  // ou aninhado em um objeto). Prioriza valores primitivos, depois campos
  // comuns dentro de objetos (nome/name/titulo/label) e por fim quaisquer
  // chaves que contenham o alias.
  const localizarCampo = (obj, aliases = []) => {
    if (!obj || typeof obj !== 'object') return null;
    const tryValue = v => (v === null || v === undefined || v === '' ? null : v);

    for (const a of aliases) {
      if (Object.prototype.hasOwnProperty.call(obj, a)) {
        const v = tryValue(obj[a]);
        if (v != null) return v;
      }
    }

    for (const [, v] of Object.entries(obj)) {
      if (v && typeof v === 'object') {
        for (const a of aliases) {
          if (Object.prototype.hasOwnProperty.call(v, a)) {
            const vv = tryValue(v[a]);
            if (vv != null) return vv;
          }
        }
        const candidate = v.nome ?? v.name ?? v.titulo ?? v.label ?? v.descricao ?? v.description ?? null;
        if (tryValue(candidate) != null) return candidate;
      }
    }

    for (const [, v] of Object.entries(obj)) {
      // se a chave contém um dos aliases, já tentamos acima; aqui só
      // verificamos valores primitivos que pareçam relevantes
      if (typeof v !== 'object' && tryValue(v) != null) return v;
    }

    return null;
  };

  const acaoRaw = localizarCampo(doc, ['acao', 'acaoHabilidade', 'acaoArte', 'acaoVariante', 'acaoNome', 'action', 'actionName', 'abilityAction', 'skillAction', 'trigger']);
  // Determina o tipo legível da ação: Imediata / Duradoura / Sustentada
  const determinarTipoAcao = (raw, docObj) => {
    const preferencias = [];
    if (docObj) {
      preferencias.push(docObj.tipoAcao ?? docObj.tipo_acao ?? docObj.tipo ?? null);
    }
    preferencias.push(raw);

    const textFrom = v => (v == null ? '' : String(v).toLowerCase());
    const texto = preferencias.map(textFrom).join(' ');

    if (/imediat|instant|instantânea|instantanea|immediate|quick|rápida|rapida/.test(texto)) return 'Imediata';
    if (/sustent|sustain|sustained/.test(texto)) return 'Sustentada';
    if (/durad|duration|long|longo|longa/.test(texto)) return 'Duradoura';

    // fallback: se o raw for curto e reconhecível como chave (p.ex. 'I','D','S') mapear
    const short = String(raw ?? '').trim().toLowerCase();
    if (short === 'i' || short === 'im' || short === 'imediata') return 'Imediata';
    if (short === 'd' || short === 'duradoura' || short === 'dur') return 'Duradoura';
    if (short === 's' || short === 'sustentada' || short === 'sus') return 'Sustentada';

    return raw == null ? 'N/D' : String(raw);
  };
  const tipoAcao = determinarTipoAcao(acaoRaw, doc);
  const duracao = doc.duracao ?? doc.duracaoHabilidade ?? doc.duration ?? 'N/D';
  const alcance = doc.alcance ?? doc.range ?? 'N/D';
  const alvos = doc.alvos ?? doc.targets ?? 'N/D';
  const custo = doc.custo ?? doc.cost ?? 'N/D';
  const descricao = doc.descricao ?? doc.description ?? 'Sem descrição disponível';
  const condicoes =
    doc.condicao ??
    doc.condicoes ??
    doc.conditions ??
    doc.requisitos ??
    doc.condicoesAplicadas ??
    doc.condicoesAtivas ??
    doc.condicaoAplicada ??
    doc.condicaoAtiva ??
    doc.condicoesEscolhidas ??
    doc.condicoesSelecionadas ??
    doc.condicaoEscolhida ??
    doc.condicaoSelecionada ??
    null;
  const cantico =
    doc.cantico ??
    doc.canto ??
    doc.canting ??
    doc.canticoArte ??
    doc.cantoArte ??
    doc.canto ??
    null;
  const origem = doc.origem ?? doc.origin ?? null;
  const dominio = doc.dominio ?? doc.domain ?? null;
  const updated =
    doc.updatedAt ?? doc.ultimaAtualizacao ?? doc.updated_at ?? null;

  const tabs = [
    { id: 'descricao', label: 'Descrição' },
    { id: 'cantico', label: 'Cântico' },
    { id: 'condicoes', label: 'Condições' },
  ];

  const renderCondicoesContent = () => {
    if (condicoes === null || condicoes === undefined) {
      return (
        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Não há condições cadastradas.
        </Typography>
      );
    }

    const items = Array.isArray(condicoes) ? condicoes : [condicoes];
    if (items.length === 0) {
      return (
        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Não há condições cadastradas.
        </Typography>
      );
    }

    const tokens = items.map((item, index) => {
      const condicaoId =
        typeof item === 'string' || typeof item === 'number'
          ? String(item)
          : item?.id ?? item?.condicaoId ?? item?.conditionId ?? null;
      const referencia = condicaoId
        ? condicaoReferencias[condicaoId]
        : null;

      if (referencia) {
        return {
          key: referencia.id,
          label:
            referencia.nome ?? referencia.name ?? referencia.titulo ?? referencia.label ?? referencia.id,
          image: resolveImagemAsset(referencia),
        };
      }

      if (item === null || item === undefined || item === '') {
        return {
          key: `condicao-empty-${index}`,
          label: '—',
          image: null,
        };
      }

      if (typeof item === 'string' || typeof item === 'number') {
        return {
          key: String(item),
          label: String(item),
          image: null,
        };
      }

      const label =
        item.nome ?? item.name ?? item.titulo ?? item.label ?? item.id ?? '—';
      return {
        key: item.id ?? label ?? `condicao-${index}`,
        label: String(label),
        image: resolveImagemAsset(item),
      };
    });

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 1.25,
        }}
      >
        {tokens.map(({ key, image, label }) => (
          <Box
            key={key}
            sx={{
              p: 1,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'rgba(10,15,28,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {image ? (
                <Box
                  component="img"
                  src={image}
                  alt={label}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography
                  sx={{
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {label.charAt(0).toUpperCase()}
                </Typography>
              )}
            </Box>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'cantico') {
      return (
        <CampoValor
          valor={cantico ?? 'Não há cântico cadastrado.'}
        />
      );
    }

    if (activeTab === 'condicoes') {
      return renderCondicoesContent();
    }

    return <CampoValor valor={descricao} />;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        background: 'rgba(6,11,20,0.96)',
        border: '1px solid rgba(212,175,55,0.18)',
        borderRadius: '22px',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 420,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1 }}
          >
            {nome}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {tipo && (
              <Chip
                label={String(tipo)}
                size="small"
                sx={{
                  background: 'rgba(20,34,58,0.9)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  fontWeight: 700,
                }}
              />
            )}
            {categorias.map((categoria, index) => (
              <Chip
                key={`categoria-${index}`}
                label={String(categoria)}
                size="small"
                sx={{
                  background: 'rgba(20,34,58,0.9)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  fontWeight: 700,
                }}
              />
            ))}
          </Box>
        </Box>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 2,
            overflow: 'hidden',
            background: 'rgba(10,15,28,0.9)',
            border: '1px solid rgba(212,175,55,0.22)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imagem ? (
            <Box
              component="img"
              src={imagem}
              alt={nome}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
              {String(nome).charAt(0) ?? '·'}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 1,
          mb: 2,
        }}
      >
        {[
          { label: 'Recarga', value: recarga },
          { label: 'Ação', value: tipoAcao },
          { label: 'Duração', value: duracao },
          { label: 'Alcance', value: alcance },
          { label: 'Alvos', value: alvos },
          { label: 'Custo', value: custo },
        ].map(({ label, value }) => (
          <Paper
            key={label}
            elevation={0}
            sx={{
              p: 1.25,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              minHeight: 72,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: 'rgba(200,210,230,0.8)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>
              {label}
            </Typography>
            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
              {String(value)}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {tabs.map(tab => (
          <Chip
            key={tab.id}
            clickable
            onClick={() => setActiveTab(tab.id)}
            label={tab.label}
            size="small"
            sx={{
              background: activeTab === tab.id ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'rgba(200,210,230,0.75)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          />
        ))}
      </Box>

      <Box
        sx={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 2,
          p: 2,
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1, fontSize: '0.95rem' }}>
          {tabs.find(tab => tab.id === activeTab)?.label ?? 'Descrição'}
        </Typography>
        {activeTab === 'descricao' ? (
          <Box sx={{ maxHeight: 'calc(1.7em * 4 + 0.5rem)', overflowY: 'auto', pr: 0.75 }}>
            {renderTabContent()}
          </Box>
        ) : (
          renderTabContent()
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mt: 2 }}>
        <Typography sx={{ color: 'rgba(200,210,230,0.75)', fontSize: '0.75rem' }}>
          Atualizado em {ehTimestamp(updated) ? formatarTimestamp(updated) : String(updated ?? 'N/D')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {dominio && (
            <Chip
              label={`Domínio ${String(dominio)}`}
              size="small"
              sx={{
                background: 'rgba(12,24,48,0.95)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 700,
              }}
            />
          )}
          {origem && (
            <Chip
              label={String(origem)}
              size="small"
              sx={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

ArtCard.propTypes = {
  doc: PropTypes.object.isRequired,
  titulo: PropTypes.string,
  condicaoReferencias: PropTypes.object,
};

const resolveImagemAsset = doc => {
  if (!doc || typeof doc !== 'object') return null;

  const resolveField = field => {
    const value = doc[field];
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.url ?? value.link ?? value.src ?? null;
    return null;
  };

  return (
    resolveField('linkImagem') ??
    resolveField('imageUrl') ??
    resolveField('urlImagem') ??
    resolveField('imagemUrl') ??
    resolveField('imagem') ??
    resolveField('image') ??
    resolveField('icon') ??
    resolveField('icone') ??
    resolveField('token') ??
    resolveField('foto') ??
    resolveField('thumbnail') ??
    null
  );
};

const AptidaoItem = ({ doc, referencia, titulo }) => {
  const nome = titulo ?? doc.nome ?? doc.id;
  const imagem = resolveImagemAsset(referencia) ?? resolveImagemAsset(doc);
  const nivel =
    referencia?.nivel ??
    referencia?.level ??
    referencia?.nivelAtual ??
    referencia?.nivel_atual ??
    doc.nivel ??
    doc.level ??
    doc.nivelAtual ??
    doc.nivel_atual ??
    null;
  const updated =
    referencia?.updatedAt ??
    referencia?.ultimaAtualizacao ??
    referencia?.updated_at ??
    doc.updatedAt ??
    doc.ultimaAtualizacao ??
    doc.updated_at ??
    null;

  return (
    <Paper
      elevation={0}
      sx={{
        background: 'rgba(15,23,42,0.55)',
        border: '1px solid rgba(212,175,55,0.10)',
        borderRadius: '18px',
        p: '18px 20px',
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        width: '100%',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(212,175,55,0.22)',
          boxShadow: '0 6px 20px rgba(212,175,55,0.06)',
          transform: 'translateY(-2px)'
        },
      }}
    >
      <Box sx={{ flex: '0 0 auto', width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,12,16,0.6)', border: '1px solid rgba(212,175,55,0.08)' }}>
        {imagem ? (
          <Box component="img" src={imagem} alt={nome} sx={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }} />
        ) : (
          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>{String(nome).charAt(0) ?? '·'}</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: '1 1 0' }}>
        <Typography sx={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '18px', textAlign: 'left' }}>{nome}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {nivel !== null && (
            <Box sx={{ background: 'rgba(2,10,30,0.9)', border: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-primary)', px: 1.25, py: '4px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700 }}>
              {`Nível ${nivel}`}
            </Box>
          )}
          {updated && (
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: { xs: 'normal', sm: 'nowrap' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ehTimestamp(updated) ? formatarTimestamp(updated) : String(updated)}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

AptidaoItem.propTypes = {
  doc: PropTypes.object.isRequired,
  referencia: PropTypes.object,
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

const renderTabLabel = (label, count, active = false) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.7,
      whiteSpace: 'nowrap',
    }}
  >
    <Box component="span" sx={{ lineHeight: 1.2 }}>
      {count !== null ? `${label} (${count})` : label}
    </Box>
    {count !== null && (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 22,
          height: 20,
          px: 0.7,
          borderRadius: 999,
          fontSize: '0.72rem',
          fontWeight: 700,
          lineHeight: 1,
          bgcolor: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
          color: active ? 'var(--text-primary)' : 'inherit',
          border: active ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {count}
      </Box>
    )}
  </Box>
);

const PersonagemFichaDialog = ({
  open,
  onClose,
  personagem,
  clone = null,
  actions = null
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
  const [aptidaoReferencias, setAptidaoReferencias] = useState({});
  const [racaNome, setRacaNome] = useState();
  const [classeNomes, setClasseNomes] = useState({});
  const [noVeiaAstralNomes, setNoVeiaAstralNomes] = useState({});
  const [origemNome, setOrigemNome] = useState();
  const [noVeiaAstralIcons, setNoVeiaAstralIcons] = useState({});
  const [condicaoReferencias, setCondicaoReferencias] = useState({});
  const [criadorNome, setCriadorNome] = useState();

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setAba(0);
      setAptidaoReferencias({});
      setRacaNome(undefined);
      setClasseNomes({});
      setNoVeiaAstralNomes({});
      setCriadorNome(undefined);
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
            if (active) {
              setNoVeiaAstralNomes(prev => ({
                ...prev,
                [id]: no?.nome ?? null,
              }));
              const icone = resolveImagemAsset(no);
              setNoVeiaAstralIcons(prev => ({ ...prev, [id]: icone }));
            }
          })
          .catch(() => {
            if (active) {
              setNoVeiaAstralNomes(prev => ({ ...prev, [id]: null }));
              setNoVeiaAstralIcons(prev => ({ ...prev, [id]: null }));
            }
          });
      });
      if (personagem.origem) {
        // tenta resolver origem para mostrar nome legível
        getOrigem(personagem.origem)
          .then(o => {
            if (active) setOrigemNome(o?.nome ?? null);
          })
          .catch(() => {
            if (active) setOrigemNome(null);
          });
      }

      // `uid` guarda o dono do personagem no Re-Dungeon (ver firestore.rules,
      // match /personagens/{id}) — resolve para o `nome` cadastrado em
      // userPermissions/{uid}; sem nome cadastrado, quem exibe cai de volta
      // para o uid cru.
      if (personagem.uid) {
        getUsuarioNome(personagem.uid)
          .then(nome => {
            if (active) setCriadorNome(nome);
          })
          .catch(() => {
            if (active) setCriadorNome(null);
          });
      }
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
            .then(aptidao => [item.id, aptidao ?? null])
            .catch(() => [item.id, null]),
        ),
      ).then(pares => {
        if (active) setAptidaoReferencias(Object.fromEntries(pares));
      });
    });
    return () => {
      active = false;
    };
  }, [subcolecoes.aptidoesAdquiridas]);

  useEffect(() => {
    if (!open || !personagem) return undefined;
    const universoId = personagem.universo ?? personagem.universoId ?? personagem.universo?.id;
    if (!universoId) return undefined;

    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      getCondicoes(universoId)
        .then(condicoes => {
          if (active) {
            setCondicaoReferencias(
              Object.fromEntries(condicoes.map(condicao => [condicao.id, condicao])),
            );
          }
        })
        .catch(() => {
          if (active) setCondicaoReferencias({});
        });
    });
    return () => {
      active = false;
    };
  }, [open, personagem]);

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
    origem: personagem.origem
      ? origemNome === undefined
        ? personagem.origem
        : (origemNome ?? 'Origem não encontrada')
      : personagem.origem,
  };

  const campos = personagemResolvido
    ? Object.entries(personagemResolvido).filter(
        ([campo, valor]) => !CAMPOS_OCULTOS.has(campo) && !ehVazio(valor),
      )
    : [];

  const statusValue = valor => valor?.atual ?? valor ?? '—';

  const infoJogadorBase =
    clone?.infoJogador ??
    clone?.informacoesJogador ??
    personagem?.infoJogador ??
    personagem?.informacoesJogador ??
    null;

  const infoJogador = {
    titulo: resolverValorInfoJogador(
      [
        clone,
        infoJogadorBase,
        personagem,
      ],
      ['titulo', 'tituloJogador', 'title', 'titleJogador', 'titlePlayer'],
    ),
    afiliacao: resolverValorInfoJogador(
      [
        clone,
        infoJogadorBase,
        personagem,
      ],
      ['afiliacao', 'afiliacaoJogador', 'affiliation', 'affiliationJogador', 'faction', 'organization', 'group'],
    ),
    statusNarrativo: resolverValorInfoJogador(
      [
        clone,
        infoJogadorBase,
        personagem,
      ],
      ['statusNarrativo', 'statusNarrativoJogador', 'narrativeStatus', 'narrativeStatusJogador', 'statusNarrativoInfo'],
    ),
    background: resolverValorInfoJogador(
      [
        clone,
        infoJogadorBase,
        personagem,
      ],
      ['background', 'backgroundJogador', 'backgroundPlayer', 'backgroundInfo', 'backgroundJogadorInfo', 'backgroundPlayerInfo'],
    ),
    notasAdicionais: resolverValorInfoJogador(
      [
        clone,
        infoJogadorBase,
        personagem,
      ],
      ['notasAdicionais', 'notasAdicionaisJogador', 'additionalNotes', 'additionalNotesJogador', 'notes', 'notesJogador'],
    ),
  };

  const temInfoJogador = Object.values(infoJogador).some(v => !ehVazio(v));

  const construirMeta = () => {
    const meta = [];
    if (personagem?.idade) meta.push(personagem.idade);
    return meta.filter(Boolean).join(' · ');
  };

  // `criadorNome` vem de userPermissions/{personagem.uid}.nome (ver efeito
  // acima); sem nome cadastrado lá, cai para o uid cru — nunca esconde a
  // informação de quem criou a ficha.
  const resolverNomeCriador = () => criadorNome ?? personagem?.uid ?? null;

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

    const buscarValorCampo = aliases => {
      for (const alias of aliases) {
        const valor =
          clone?.[alias] ?? personagemResolvido?.[alias] ?? personagem?.[alias];
        if (!ehVazio(valor)) return valor;
      }
      return null;
    };

    const nivelAtual = buscarValorCampo([
      'nivel',
      'level',
      'nivelAtual',
      'nivel_atual',
    ]);
    const xpAtual = buscarValorCampo([
      'xpAtual',
      'xp_atual',
      'xp',
      'experienciaAtual',
      'experiencia_atual',
      'experiencia',
      'experience',
    ]);
    const pontosPrincipaisDisponiveis = buscarValorCampo([
      'pontosPrincipais',
      'pontos_principais',
      'pontosPrincipaisDisponiveis',
      'pontos_principais_disponiveis',
      'pontosPrincipaisAtuais',
      'pontos_principais_atuais',
      'mainPoints',
      'pointsMain',
    ]);
    const pontosSecundariosDisponiveis = buscarValorCampo([
      'pontosSecundarios',
      'pontos_secundarios',
      'pontosSecundariosDisponiveis',
      'pontos_secundarios_disponiveis',
      'pontosSecundariosAtuais',
      'pontos_secundarios_atuais',
      'secondaryPoints',
      'pointsSecondary',
    ]);
    const historicoNivelRaw = buscarValorCampo([
      'historicoNivel',
      'historico_nivel',
      'nivelHistorico',
      'nivel_historico',
      'historicoLevel',
      'historico_level',
      'levelHistory',
      'level_history',
    ]);

    const nivelHistoricoItems = (() => {
      if (!historicoNivelRaw) return [];
      const rawItems = Array.isArray(historicoNivelRaw)
        ? historicoNivelRaw
        : [historicoNivelRaw];
      return rawItems
        .map(item => {
          if (item === null || item === undefined || item === '') return null;
          if (typeof item === 'string' || typeof item === 'number') {
            return {
              nivel: String(item),
              data: null,
              descricao: null,
            };
          }
          if (typeof item === 'object') {
            const nivel =
              extrairCampoHistorico(item, [
                'nivel',
                'level',
                'nivelAtual',
                'nivel_atual',
              ]) ??
              normalizarTextoValor(item?.nivel ?? item?.level ?? item?.nivelAtual ?? item?.nivel_atual) ??
              null;
            const data = formatarTextoHistorico(
              extrairCampoHistorico(item, [
                'data',
                'createdAt',
                'updatedAt',
                'timestamp',
                'dataHora',
                'dataRegistro',
                'momento',
                'date',
                'dateTime',
              ]),
            );
            const descricao = formatarTextoHistorico(
              extrairCampoHistorico(item, [
                'descricao',
                'descricaoNivel',
                'detalhes',
                'recompensa',
                'resultado',
                'nota',
                'observacao',
                'observacoes',
                'descricaoEvento',
                'resumo',
              ]) ?? item,
            );
            return {
              nivel: nivel ?? normalizarTextoValor(item) ?? 'Nível',
              data,
              descricao:
                descricao && descricao !== nivel ? descricao : null,
            };
          }
          return {
            nivel: String(item),
            data: null,
            descricao: null,
          };
        })
        .filter(Boolean);
    })();

    const renderNivelCard = ({ label, value, description, icon: Icon }) => {
      const valorExibido = normalizarValorSimples(value);
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            background: 'rgba(18, 22, 32, 0.92)',
            border: '1px solid rgba(212,175,55,0.12)',
            borderRadius: 2,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1,
            wordBreak: 'normal',
            overflowWrap: 'normal',
            whiteSpace: 'normal',
            minWidth: 180,
          }}
        >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(212,175,55,0.16)',
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(212,175,55,0.94)',
            }}
          >
            {Icon ? <Icon sx={{ fontSize: 16 }} /> : '✦'}
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 700,
              fontSize: { xs: '0.64rem', sm: '0.68rem' },
              lineHeight: 1.2,
              wordBreak: 'normal',
              overflowWrap: 'normal',
            }}
          >
            {label}
          </Typography>
        </Box>
        <Typography
          sx={{
            color: 'var(--text-primary)',
            fontWeight: 800,
            fontSize: { xs: '1.4rem', sm: '1.8rem' },
            lineHeight: 1,
            wordBreak: 'normal',
            overflowWrap: 'normal',
          }}
        >
          {valorExibido ?? '—'}
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: { xs: '0.72rem', sm: '0.78rem' },
            lineHeight: 1.35,
            wordBreak: 'normal',
            overflowWrap: 'normal',
            whiteSpace: 'normal',
          }}
        >
          {description}
        </Typography>
      </Paper>
    );
    };

    const renderNivelHistorico = () => (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          background: 'rgba(12, 14, 20, 0.96)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 2,
          minHeight: 216,
          display: 'grid',
          gap: 1.5,
        }}
      >
        <Typography
          sx={{
            color: 'rgba(212,175,55,0.96)',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: 1,
            fontSize: '0.74rem',
          }}
        >
          Histórico de Nível
        </Typography>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            pr: 1,
          }}
        >
          {nivelHistoricoItems.length === 0 ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                minHeight: 132,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
              }}
            >
              Nenhum histórico de progressão registrado
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                position: 'relative',
                pl: 2,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 8,
                  top: 10,
                  bottom: 10,
                  width: 1,
                  background: 'rgba(255,255,255,0.12)',
                },
              }}
            >
              {nivelHistoricoItems.map((item, index) => (
                <Box key={`${String(item.nivel)}-${index}`} sx={{ display: 'grid', gap: 0.75, position: 'relative' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -10,
                      top: 8,
                      width: 12,
                      height: 12,
                      transform: 'rotate(45deg)',
                      background: 'rgba(212,175,55,0.95)',
                      border: '1px solid rgba(212,175,55,0.24)',
                    }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      sx={{
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '0.96rem',
                      }}
                    >
                      {item.nivel || 'Nível'}
                    </Typography>
                    {item.data ? (
                      <Typography
                        sx={{
                          color: 'var(--text-muted)',
                          fontSize: '0.72rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.data}
                      </Typography>
                    ) : null}
                  </Box>
                  {item.descricao ? (
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.68)',
                        fontSize: '0.78rem',
                        lineHeight: 1.45,
                      }}
                    >
                      {item.descricao}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    );

    const renderNivelSection = () => {
      const hasNivelData =
        !ehVazio(nivelAtual) ||
        !ehVazio(xpAtual) ||
        !ehVazio(pontosPrincipaisDisponiveis) ||
        !ehVazio(pontosSecundariosDisponiveis) ||
        nivelHistoricoItems.length > 0;

      if (!hasNivelData) return null;

      return (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <AutoAwesomeOutlinedIcon sx={{ color: 'rgba(212,175,55,0.94)', fontSize: 18 }} />
            <Typography
              sx={{
                color: 'rgba(212,175,55,0.96)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 700,
                fontSize: '0.82rem',
              }}
            >
              Nível
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(220px, 1fr))',
                md: 'repeat(4, minmax(220px, 1fr))',
              },
              alignItems: 'stretch',
            }}
          >
            {renderNivelCard({
              label: 'Nível Atual',
              value: nivelAtual,
              description: 'Nível do personagem',
              icon: AutoAwesomeOutlinedIcon,
            })}
            {renderNivelCard({
              label: 'XP Atual',
              value: xpAtual,
              description: 'Experiência acumulada',
              icon: AutoAwesomeOutlinedIcon,
            })}
            {renderNivelCard({
              label: 'Pontos Principais',
              value: pontosPrincipaisDisponiveis,
              description: 'Disponíveis',
              icon: AutoAwesomeOutlinedIcon,
            })}
            {renderNivelCard({
              label: 'Pontos Secundários',
              value: pontosSecundariosDisponiveis,
              description: 'Disponíveis',
              icon: AutoAwesomeOutlinedIcon,
            })}
          </Box>
          {renderNivelHistorico()}
        </Box>
      );
    };

    const renderedKeys = new Set();

    // Marcar campos utilizados para que não apareçam em outros painéis.
    [
      'nivel',
      'level',
      'nivelAtual',
      'nivel_atual',
      'xpAtual',
      'xp_atual',
      'xp',
      'experienciaAtual',
      'experiencia_atual',
      'experiencia',
      'experience',
      'pontosPrincipais',
      'pontos_principais',
      'pontosPrincipaisDisponiveis',
      'pontos_principais_disponiveis',
      'pontosPrincipaisAtuais',
      'pontos_principais_atuais',
      'mainPoints',
      'pointsMain',
      'pontosSecundarios',
      'pontos_secundarios',
      'pontosSecundariosDisponiveis',
      'pontos_secundarios_disponiveis',
      'pontosSecundariosAtuais',
      'pontos_secundarios_atuais',
      'secondaryPoints',
      'pointsSecondary',
      'historicoNivel',
      'historico_nivel',
      'nivelHistorico',
      'nivel_historico',
      'historicoLevel',
      'historico_level',
      'levelHistory',
      'level_history',
    ].forEach(key => renderedKeys.add(key));

    // Helpers para renderizar listas de atributos com alinhamento nome/valor
    const renderAttributeList = (obj, primaryOrder) => {
      if (!obj || typeof obj !== 'object') return null;
      const entries = Object.entries(obj).filter(([, v]) => !ehVazio(v));
      if (entries.length === 0) return null;

      // Ordenar conforme order passado (aliases) quando disponível
      let ordered = entries;
      if (Array.isArray(primaryOrder) && primaryOrder.length > 0) {
        const mapIdx = Object.fromEntries(primaryOrder.map((a, i) => [a, i]));
        ordered = entries.slice().sort(([kA], [kB]) => {
          const iA = mapIdx[kA] ?? Number.MAX_SAFE_INTEGER;
          const iB = mapIdx[kB] ?? Number.MAX_SAFE_INTEGER;
          return iA - iB;
        });
      }

      return (
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          {ordered.map(([k, v]) => (
            <Box
              key={k}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 1,
                alignItems: 'center',
                py: 0.5,
                borderBottom: '1px solid rgba(255,255,255,0.02)',
              }}
            >
              <Typography sx={{ color: 'var(--text-secondary)' }}>
                {humanizarLabel(k)}
              </Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right' }}>
                {ehTimestamp(v) ? formatarTimestamp(v) : Array.isArray(v) ? v.join(', ') : String(v)}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    };

    
    // Ordem visual obrigatória conforme pedido do usuário
    const orderedGroups = [
      { key: 'atributosBonus', title: 'Atributos Bônus', type: 'primarios' },
      { key: 'atributosExtra', title: 'Atributos Extra', type: 'primarios' },
      { key: 'secundariosExtra', title: 'Secundários Extra', type: 'secundarios' },
      { key: 'secundariosBonus', title: 'Secundários Bônus', type: 'secundarios' },
      { key: 'atributosBase', title: 'Atributos Base', type: 'primarios' },
      { key: 'secundariosBase', title: 'Secundários Base', type: 'secundarios' },
    ];

    // Render de atributos totais em grade compacta com estilo dourado
    const renderAtributosTotais = () => {
      const obj = personagem?.atributosTotais ?? personagem?.atributos;
      if (!obj || typeof obj !== 'object') return null;
      renderedKeys.add('atributosTotais');
      const itens = ATRIBUTOS_PRINCIPAIS_DIALOG.map(({ label, aliases }) => ({ label, key: aliases[0], value: obj[aliases[0]] ?? '—' }));

      return (
        <Paper elevation={0} sx={{ p: 2.25, background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '16px' }}>
          <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
            Atributos Totais
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1 }}>
            {itens.map(item => (
              <Box key={item.key} sx={{ p: 1.25, background: 'rgba(18,22,32,0.6)', borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 84 }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.label}</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.1rem' }}>{String(item.value)}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      );
    };

    const renderSecundariosTotais = () => {
      const obj = personagem?.secundariosTotais ?? personagem?.secundarios;
      if (!obj || typeof obj !== 'object') return null;
      renderedKeys.add('secundariosTotais');
      const itens = ATRIBUTOS_SECUNDARIOS_DIALOG.map(({ label, aliases }) => ({ label, key: aliases[0], value: obj[aliases[0]] ?? '—' }));
      return (
        <Paper elevation={0} sx={{ p: 2.25, background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '16px' }}>
          <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
            Secundários Totais
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 1 }}>
            {itens.map(item => (
              <Box key={item.key} sx={{ p: 1.25, background: 'rgba(18,22,32,0.6)', borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 84 }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.label}</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.1rem' }}>{String(item.value)}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      );
    };

    // Para rastrear quais campos já renderizamos e evitar duplicação

    const renderGroup = ({ key, title, type }) => {
      const valor = personagem?.[key];
      if (ehVazio(valor)) return null;
      renderedKeys.add(key);

      if (type === 'primarios') {
        const order = ATRIBUTOS_PRINCIPAIS_DIALOG.map(a => a.aliases[0]);
        return (
          <SmallPanel key={key} title={title}>
            {renderAttributeList(valor, order)}
          </SmallPanel>
        );
      }

      if (type === 'secundarios') {
        const order = ATRIBUTOS_SECUNDARIOS_DIALOG.map(a => a.aliases[0]);
        return (
          <SmallPanel key={key} title={title}>
            {renderAttributeList(valor, order)}
          </SmallPanel>
        );
      }

      if (type === 'veias') {
        // Exibir como tokens circulares com o nome centralizado abaixo
        const nos = personagem?.veiasAstrais?.nosDesbloqueados ?? [];
        return (
          <SmallPanel key={key} title={title}>
            {Array.isArray(nos) && nos.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {nos.map((id, i) => {
                  const nome = resolverNome(noVeiaAstralNomes, id);
                  const icone = noVeiaAstralIcons[id];
                  return (
                    <Box key={`${id}-${i}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, width: 92 }}>
                      <Box
                        aria-hidden
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          background: 'linear-gradient(180deg, rgba(212,175,55,0.14), rgba(212,175,55,0.06))',
                          border: '1px solid rgba(212,175,55,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          textTransform: 'uppercase',
                          overflow: 'hidden',
                        }}
                      >
                        {(() => {
                          if (!icone) return <Typography sx={{ color: 'var(--text-primary)' }}>{String(nome).charAt(0) ?? '·'}</Typography>;
                          const imagem = resolveImagemAsset({ imagem: icone, image: icone, icon: icone, token: icone, foto: icone, thumbnail: icone });
                          const isUrl = typeof imagem === 'string' && (imagem.startsWith('http://') || imagem.startsWith('https://'));
                          if (isUrl) {
                            return (
                              <Box component="img" src={imagem} alt={nome} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            );
                          }
                          return (
                            <Typography sx={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                              {String(icone)}
                            </Typography>
                          );
                        })()}
                      </Box>
                      <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.75rem', textAlign: 'center', wordBreak: 'break-word', maxWidth: 88 }}>
                        {nome}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</Typography>
            )}
          </SmallPanel>
        );
      }

      if (type === 'sorte') {
        renderedKeys.add('sorte');
        return (
          <SmallPanel key={key} title={title}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                <Typography sx={{ color: 'var(--text-secondary)' }}>Fortuna Atual</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>{resolverValorSorte(personagem, ['sorte'])}</Typography>
              </Box>
              {personagem?.historicoSorte && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                  <Typography sx={{ color: 'var(--text-secondary)' }}>Última Rolagem</Typography>
                  <Typography sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>{String(personagem.historicoSorte?.slice(-1)[0] ?? '—')}</Typography>
                </Box>
              )}
            </Box>
          </SmallPanel>
        );
      }

      // Fallback: usar SecaoCampo para garantir nenhuma perda de dados
      return (
        <SmallPanel key={key} title={title}>
          <CampoValor valor={valor} />
        </SmallPanel>
      );
    };

    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        {/* Distribuir orderedGroups em 3 colunas responsivas */}
        {(() => {
          const cols = 3;
          const per = Math.ceil(orderedGroups.length / cols);
          const columns = Array.from({ length: cols }, (_, i) => orderedGroups.slice(i * per, (i + 1) * per));
          return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {columns.map((col, idx) => (
                <Box key={idx} sx={{ display: 'grid', gap: 1 }}>
                  {col.map(g => renderGroup(g))}
                </Box>
              ))}
            </Box>
          );
        })()}

        {/* Atributos Totais e Secundários Totais lado a lado (2 colunas responsivas) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {renderAtributosTotais()}
          {renderSecundariosTotais()}
        </Box>

        {renderNivelSection()}

        {/* Raça / Habilidades Ativas em card compacto */}
        {/* Raça / Habilidades Ativas, Origem e Sorte em três colunas responsivas */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          {personagemResolvido?.raca && (() => {
            renderedKeys.add('raca');
            return (
              <SmallPanel title="Raça / Habilidades Ativas">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>{personagemResolvido.raca}</Typography>
                  {personagemResolvido?.habilidadesAtivas ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {personagemResolvido.habilidadesAtivas.map((h, i) => (
                        <Paper key={`${h}-${i}`} elevation={0} sx={{ px: 1, py: 0.5, background: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                          <Typography sx={{ color: 'var(--text-primary)' }}>{String(h)}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              </SmallPanel>
            );
          })()}

          {personagemResolvido?.origem && (() => {
            renderedKeys.add('origem');
            return (
              <SmallPanel title="Origem">
                <Box sx={{ fontFamily: 'monospace', wordBreak: 'break-all', whiteSpace: 'pre-wrap', p: 0.5 }}>
                  <Typography sx={{ color: 'var(--text-primary)' }}>{String(personagemResolvido.origem)}</Typography>
                </Box>
              </SmallPanel>
            );
          })()}

          {/* Sorte — mover para a terceira coluna junto com Raça/Origem */}
          {(() => {
            // marcar como renderizado para evitar duplicação posterior
            renderedKeys.add('sorte');
            return (
              <SmallPanel title="Sorte">
                <Box sx={{ display: 'grid', gap: 0.5 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                    <Typography sx={{ color: 'var(--text-secondary)' }}>Fortuna Atual</Typography>
                    <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>{resolverValorSorte(personagem, ['sorte'])}</Typography>
                  </Box>
                  {personagem?.historicoSorte && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                      <Typography sx={{ color: 'var(--text-secondary)' }}>Última Rolagem</Typography>
                      <Typography sx={{ color: 'var(--text-primary)', textAlign: 'right' }}>{String(personagem.historicoSorte?.slice(-1)[0] ?? '—')}</Typography>
                    </Box>
                  )}
                </Box>
              </SmallPanel>
            );
          })()}
        </Box>

        {/* Loja Trapaceiro / Loja Rokmas padronizada */}
        {(() => {
          const lojaDados = personagem?.lojaRokmas ?? personagem?.lojaTrapaceiro ?? null;
          const lojaTitle = personagem?.lojaRokmas ? 'Loja Rokmas' : 'Loja Trapaceiro';
          renderedKeys.add('lojaRokmas');
          renderedKeys.add('lojaTrapaceiro');

          if (ehVazio(lojaDados)) {
            return (
              <SmallPanel title={lojaTitle}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: 'var(--text-muted)' }}>👜</Typography>
                  <Typography sx={{ color: 'var(--text-muted)' }}>Nenhum item disponível</Typography>
                </Box>
              </SmallPanel>
            );
          }

          const saldoRokmas =
            lojaDados?.saldoRokmas ??
            lojaDados?.saldo_rokmas ??
            lojaDados?.saldo ??
            lojaDados?.balance ??
            null;
          const historicoCompras =
            lojaDados?.historicoCompras ??
            lojaDados?.historico_compras ??
            lojaDados?.compras ??
            lojaDados?.purchaseHistory ??
            lojaDados?.history ??
            null;

          const hasSaldo = !ehVazio(saldoRokmas);
          const hasHistorico = !ehVazio(historicoCompras);

          return (
            <SmallPanel title={lojaTitle}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                {(hasSaldo || hasHistorico) ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: hasSaldo && hasHistorico ? '260px minmax(0, 1fr)' : '1fr',
                      },
                    }}
                  >
                    {hasSaldo && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          background: 'rgba(18, 22, 32, 0.92)',
                          border: '1px solid rgba(212,175,55,0.12)',
                          borderRadius: 2,
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                          minHeight: 100,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 1,
                          textAlign: 'center',
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
                          Saldo Rokmas
                        </Typography>
                        <Typography
                          sx={{
                            color: 'var(--text-primary)',
                            fontWeight: 800,
                            fontSize: '1.8rem',
                            lineHeight: 1,
                          }}
                        >
                          {normalizarValorSimples(saldoRokmas) ?? '—'}
                        </Typography>
                      </Paper>
                    )}
                    {hasHistorico && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          background: 'rgba(12, 14, 20, 0.96)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 2,
                          minHeight: 320,
                          display: 'grid',
                          gap: 1,
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
                          Histórico de Compras
                        </Typography>
                        {Array.isArray(historicoCompras) ? (
                          <Box sx={{ display: 'grid', gap: 1, maxHeight: 260, overflowY: 'auto', pr: 0.5 }}>
                            {historicoCompras.map((item, index) => (
                              <Paper
                                key={`compra-${index}`}
                                elevation={0}
                                sx={{
                                  p: 1.25,
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: 1.5,
                                }}
                              >
                                <CampoValor valor={item} />
                              </Paper>
                            ))}
                          </Box>
                        ) : (
                          <CampoValor valor={historicoCompras} />
                        )}
                      </Paper>
                    )}
                  </Box>
                ) : (
                  <CampoValor valor={lojaDados} />
                )}
              </Box>
            </SmallPanel>
          );
        })()}

        {/* Veias Astrais por último (Sorte já foi movida para a coluna superior) */}
        {renderGroup({ key: 'veiasAstrais', title: 'Veias Astrais', type: 'veias' })}

        {/* Renderizar qualquer campo não mapeado com o SecaoCampo (fallback) */}
        {campos
          .filter(([campo]) => !renderedKeys.has(campo))
          .map(([campo, valor]) => (
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
            background: 'linear-gradient(145deg, rgba(12, 14, 20, 0.99) 0%, rgba(7, 9, 14, 0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3.5,
            overflow: 'hidden',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(16px)',
          },
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2.25, md: 3.25 },
          py: { xs: 2.25, md: 2.75 },
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(16, 18, 26, 0.98) 0%, rgba(10, 12, 18, 0.96) 100%)',
          top: 0,
          zIndex: 10,
          position: 'sticky',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            width: '100%',
            pr: { xs: 0, md: 5 },
          }}
        >
          <Box sx={{ maxWidth: { xs: '100%', md: '70%' } }}>
            <Typography
              variant="h5"
              sx={{
                color: 'var(--text-primary)',
                fontWeight: 800,
                letterSpacing: 0.4,
                lineHeight: 1.15,
              }}
            >
              {personagem?.nome}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'var(--text-secondary)',
                mt: 0.6,
                fontSize: '0.92rem',
                letterSpacing: '0.01em',
              }}
            >
              Ficha completa do personagem
            </Typography>
          </Box>
        </Box>
        {personagem?.ultimaAtualizacao && (
          <Box component="span" sx={{ display: 'none' }}>
            {formatarTimestamp(personagem.ultimaAtualizacao)}
          </Box>
        )}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: 'var(--text-secondary)',
            p: 1.1,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            '&:hover': {
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-primary)',
            },
          }}
          aria-label="Fechar ficha"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(14, 16, 24, 0.98) 0%, rgba(9, 11, 16, 0.96) 100%)',
          position: 'sticky',
          top: '88px',
          zIndex: 9,
        }}
      >
        <Tabs
          value={aba}
          onChange={(_, valor) => setAba(valor)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1.5, md: 2.5 },
            py: 0.5,
            minHeight: 54,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            '& .MuiTab-root': {
              color: 'rgba(224, 230, 242, 0.7)',
              minHeight: 38,
              minWidth: 'fit-content',
              px: 1.25,
              py: 0.75,
              mx: 0.35,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.01em',
              transition: 'all 220ms ease',
              whiteSpace: 'nowrap',
              '&:hover': {
                color: 'var(--text-primary)',
                background: 'rgba(255,255,255,0.04)',
              },
            },
            '& .Mui-selected': {
              color: 'var(--text-primary) !important',
              background: 'rgba(160, 34, 34, 0.18)',
              boxShadow: 'inset 0 -2px 0 rgba(204, 54, 54, 0.75)',
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          <Tab label="Ficha" />
          {SUBCOLECOES.map(({ chave, label }, indice) => {
            const count =
              subcolecoes[chave]?.status === 'ok' && subcolecoes[chave].docs.length > 0
                ? subcolecoes[chave].docs.length
                : null;
            return (
              <Tab
                key={chave}
                label={renderTabLabel(label, count, aba === indice + 1)}
              />
            );
          })}
        </Tabs>
      </Box>

      <DialogContent
        dividers
        sx={{
          px: { xs: 1.75, md: 2.75 },
          py: { xs: 2, md: 2.75 },
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(7, 9, 14, 0.98) 0%, rgba(10, 12, 17, 0.97) 100%)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.16) transparent',
          '&::-webkit-scrollbar': {
            width: '7px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.16)',
            borderRadius: 999,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
        }}
      >
        <Box sx={{ display: 'grid', gap: 2.5, width: '100%' }}>
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
                  {resolverNomeCriador() && (
                    <Typography sx={{ color: 'var(--text-secondary)' }}>
                      Criado por {resolverNomeCriador()}
                    </Typography>
                  )}
                  <Typography sx={{ color: 'var(--text-secondary)' }}>
                    {construirMeta() || 'Nenhuma informação disponível'}
                  </Typography>
                  {/* Raça movida para o painel "Detalhes Adicionais" para evitar duplicação */}
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
              <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Box
                  sx={{
                    width: '100%',
                    minWidth: { xs: 0, sm: 640 },
                    borderCollapse: 'collapse',
                    tableLayout: 'fixed',
                  }}
                  component="table"
                >
                  <Box component="thead">
                    <Box component="tr" sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Box component="th" sx={{ textAlign: 'left', py: 1, px: 1.25 }}>
                        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Atributo</Typography>
                      </Box>
                      <Box component="th" sx={{ textAlign: 'right', py: 1, px: 1.25 }}>
                        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Base</Typography>
                      </Box>
                      <Box component="th" sx={{ textAlign: 'right', py: 1, px: 1.25 }}>
                        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Bônus</Typography>
                      </Box>
                      <Box component="th" sx={{ textAlign: 'right', py: 1, px: 1.25 }}>
                        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Extra</Typography>
                      </Box>
                      <Box component="th" sx={{ textAlign: 'right', py: 1, px: 1.25 }}>
                        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Total</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {ATRIBUTOS_PRINCIPAIS_DIALOG.map(({ label, icon: Icon, aliases }) => {
                      const [chave] = aliases;
                      const base = personagem?.atributosBase?.[chave] ?? '—';
                      const bonus = personagem?.atributosBonus?.[chave] ?? '—';
                      const extra = personagem?.atributosExtra?.[chave] ?? '—';
                      const total = resolverValorAtributoPrimario(personagem, aliases);
                      return (
                        <Box key={label} component="tr" sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)', '&:hover': { background: 'rgba(255,255,255,0.01)' } }}>
                          <Box component="td" sx={{ py: 1.25, px: 1.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {Icon && <Icon sx={{ color: 'var(--color-accent)', fontSize: 18 }} />}
                              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{label}</Typography>
                            </Box>
                          </Box>

                          <Box component="td" sx={{ py: 1.25, px: 1.25, textAlign: 'right' }}>
                            <Typography sx={{ color: 'var(--text-secondary)' }}>{String(base)}</Typography>
                          </Box>
                          <Box component="td" sx={{ py: 1.25, px: 1.25, textAlign: 'right' }}>
                            <Typography sx={{ color: 'var(--text-secondary)' }}>{String(bonus)}</Typography>
                          </Box>
                          <Box component="td" sx={{ py: 1.25, px: 1.25, textAlign: 'right' }}>
                            <Typography sx={{ color: 'var(--text-secondary)' }}>{String(extra)}</Typography>
                          </Box>

                          <Box component="td" sx={{ py: 1.25, px: 1.25, textAlign: 'right' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 64, px: 1.25, py: 0.5, borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>{String(total)}</Typography>
                            </Box>
                          </Box>
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
              {temInfoJogador ? (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <Paper elevation={0} sx={painelInfoJogadorSx}>
                    <Box sx={{ position: 'relative', zIndex: 1, display: 'grid', gap: 1.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={chipInfoJogadorSx}>Jogador</Box>
                          <Typography
                            sx={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                            }}
                          >
                            Perfil narrativo e contexto do personagem
                          </Typography>
                        </Box>
                      </Box>

                      <Paper
                        elevation={0}
                        sx={{
                          ...painelInfoJogadorSx,
                          p: 1.5,
                          background:
                            'linear-gradient(135deg, rgba(20, 24, 34, 0.96), rgba(10, 13, 21, 0.96))',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                          '&::before': { display: 'none' },
                        }}
                      >
                        <Typography
                          variant="overline"
                          sx={{
                            color: 'var(--color-accent)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.18em',
                            fontSize: '0.64rem',
                            mb: 0.8,
                            display: 'block',
                          }}
                        >
                          BACKGROUND
                        </Typography>
                        <Typography sx={textoScrollSx}>
                          {infoJogador.background ?? 'Nenhuma informação cadastrada.'}
                        </Typography>
                      </Paper>

                      <Paper
                        elevation={0}
                        sx={{
                          ...painelInfoJogadorSx,
                          p: 1.5,
                          background:
                            'linear-gradient(135deg, rgba(16, 20, 30, 0.96), rgba(10, 13, 21, 0.96))',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                          '&::before': { display: 'none' },
                        }}
                      >
                        <Typography
                          variant="overline"
                          sx={{
                            color: 'var(--color-accent)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.18em',
                            fontSize: '0.64rem',
                            mb: 0.8,
                            display: 'block',
                          }}
                        >
                          NOTAS ADICIONAIS
                        </Typography>
                        <Typography sx={textoScrollSx}>
                          {infoJogador.notasAdicionais ?? 'Nenhuma informação cadastrada.'}
                        </Typography>
                      </Paper>

                      <Box
                        sx={{
                          display: 'grid',
                          gap: 1.25,
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(3, minmax(0, 1fr))',
                          },
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.35,
                            background: 'linear-gradient(135deg, rgba(18, 23, 33, 0.96), rgba(10, 13, 21, 0.94))',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 1.75,
                            minHeight: 108,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.6,
                            boxShadow: '0 8px 22px rgba(0, 0, 0, 0.12)',
                          }}
                        >
                          <Typography
                            variant="overline"
                            sx={{
                              color: 'var(--color-accent)',
                              letterSpacing: '0.16em',
                              fontSize: '0.62rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            TÍTULO
                          </Typography>
                          <Typography sx={valorInfoJogadorSx}>
                            {infoJogador.titulo ?? '—'}
                          </Typography>
                        </Paper>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.35,
                            background: 'linear-gradient(135deg, rgba(18, 23, 33, 0.96), rgba(10, 13, 21, 0.94))',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 1.75,
                            minHeight: 108,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.6,
                            boxShadow: '0 8px 22px rgba(0, 0, 0, 0.12)',
                          }}
                        >
                          <Typography
                            variant="overline"
                            sx={{
                              color: 'var(--color-accent)',
                              letterSpacing: '0.16em',
                              fontSize: '0.62rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            AFILIAÇÃO
                          </Typography>
                          <Typography sx={valorInfoJogadorSx}>
                            {infoJogador.afiliacao ?? '—'}
                          </Typography>
                        </Paper>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.35,
                            background: 'linear-gradient(135deg, rgba(18, 23, 33, 0.96), rgba(10, 13, 21, 0.94))',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 1.75,
                            minHeight: 108,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.6,
                            boxShadow: '0 8px 22px rgba(0, 0, 0, 0.12)',
                          }}
                        >
                          <Typography
                            variant="overline"
                            sx={{
                              color: 'var(--color-accent)',
                              letterSpacing: '0.16em',
                              fontSize: '0.62rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            STATUS NARRATIVO
                          </Typography>
                          <Typography sx={valorInfoJogadorSx}>
                            {infoJogador.statusNarrativo ?? '—'}
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2.25,
                    background: 'rgba(10, 12, 17, 0.72)',
                    border: '1px dashed rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    color: 'var(--text-muted)',
                  }}
                >
                  <Typography sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nenhuma informação disponível
                  </Typography>
                </Box>
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
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        background: 'rgba(10, 12, 17, 0.72)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        textAlign: 'center',
                        display: 'grid',
                        gap: 0.75,
                      }}
                    >
                      <Typography sx={{ color: 'var(--color-accent)', fontSize: '1.35rem' }}>✦</Typography>
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        Nenhum {label.toLowerCase()} cadastrado
                      </Typography>
                      <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Este NPC ainda não possui {label.toLowerCase()} registrados.
                      </Typography>
                    </Box>
                  )}
                  {estado.status === 'ok' && estado.docs.length > 0 && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          (chave === 'arts' || chave === 'variantes')
                            ? {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(0, 1fr))',
                              }
                            : chave === 'nucleos'
                            ? {
                                xs: '1fr',
                                md: 'repeat(2, minmax(0, 1fr))',
                              }
                            : chave === 'itensInventario'
                            ? {
                                xs: '1fr',
                                sm: 'repeat(3, minmax(0, 1fr))',
                                md: 'repeat(4, minmax(0, 1fr))',
                              }
                            : {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(0, 1fr))',
                                md: 'repeat(3, minmax(0, 1fr))',
                              },
                        gap: '20px',
                      }}
                    >
                      {estado.docs.map(doc => {
                        const aptidaoReferencia = aptidaoReferencias[doc.id];
                        const titulo =
                          chave === 'aptidoesAdquiridas'
                            ? aptidaoReferencia === undefined
                              ? doc.id
                              : aptidaoReferencia?.nome ?? 'Aptidão não encontrada'
                            : null;
                        if (chave === 'arts' || chave === 'variantes') {
                          return <ArtCard key={doc.id} doc={doc} titulo={titulo} condicaoReferencias={condicaoReferencias} />;
                        }
                        if (chave === 'aptidoesAdquiridas') {
                          return <AptidaoItem key={doc.id} doc={doc} titulo={titulo} referencia={aptidaoReferencia} />;
                        }
                        if (chave === 'nucleos') {
                          return <NucleoCard key={doc.id} doc={doc} />;
                        }
                        return <CardSubcolecaoDoc key={doc.id} doc={doc} titulo={titulo} subcolecaoKey={chave} />;
                      })}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, md: 2.75 },
          py: 1.75,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(12, 14, 20, 0.98) 0%, rgba(8, 10, 15, 0.96) 100%)',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--text-secondary)',
            borderRadius: 999,
            px: 1.25,
            py: 0.75,
            textTransform: 'none',
            fontWeight: 700,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            '&:hover': {
              color: 'var(--text-primary)',
              background: 'rgba(255,255,255,0.07)',
            },
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
  clone: PropTypes.object,
  actions: PropTypes.node,
};

export default PersonagemFichaDialog;
