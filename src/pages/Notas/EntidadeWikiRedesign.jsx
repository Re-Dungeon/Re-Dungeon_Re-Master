import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import { ROUTE_PATHS } from 'common/constants/routes';
import { useCampanha } from 'context/CampanhaContext';
import { useAuth } from 'context/AuthContext';
import { useSnackbar } from 'context/SnackbarContext';
import { getRmNota, getRmVinculosPorEntidade } from 'service/storage';
import {
  normalizeEntityAttributes,
  normalizeNotaTags,
  renderNotaContentHtml,
} from './notaUtils';

const primeiroTexto = (objeto, campos) => {
  for (const campo of campos) {
    if (typeof objeto?.[campo] === 'string' && objeto[campo].trim()) {
      return objeto[campo].trim();
    }
  }
  return '';
};

const monograma = nome => {
  const palavras = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!palavras.length) return 'EN';
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return `${palavras[0][0] ?? ''}${palavras[1][0] ?? ''}`.toUpperCase();
};

const EntidadeWikiRedesign = () => {
  const navigate = useNavigate();
  const { entidadeId } = useParams();
  const { campanhaAtiva } = useCampanha();
  const { currentUser } = useAuth();
  const { notifyError } = useSnackbar();
  const [entidade, setEntidade] = useState(null);
  const [vinculos, setVinculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const loaded = await getRmNota(entidadeId);
        if (!active) return;
        if (!loaded) {
          setEntidade(null);
          setVinculos([]);
          setNotFound(true);
          return;
        }
        if (
          campanhaAtiva?.id &&
          loaded.campanhaId &&
          loaded.campanhaId !== campanhaAtiva.id
        ) {
          setEntidade(null);
          setVinculos([]);
          setNotFound(true);
          return;
        }

        const loadedVinculos =
          campanhaAtiva?.id && campanhaAtiva?.universoId && currentUser?.uid
            ? await getRmVinculosPorEntidade(
                campanhaAtiva.id,
                campanhaAtiva.universoId,
                currentUser.uid,
                entidadeId,
              ).catch(() => [])
            : [];

        if (!active) return;
        setEntidade(loaded);
        setVinculos(Array.isArray(loadedVinculos) ? loadedVinculos : []);
      } catch {
        if (active) notifyError('Não foi possível carregar a entidade.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [
    campanhaAtiva?.id,
    campanhaAtiva?.universoId,
    currentUser?.uid,
    entidadeId,
    notifyError,
  ]);

  const dados = useMemo(() => {
    if (!entidade) return null;

    const nome =
      primeiroTexto(entidade, ['titulo', 'Titulo', 'nome', 'Nome']) ||
      'Sem título';
    const tipo =
      primeiroTexto(entidade, ['tipo', 'categoria', 'Tipo']) || 'Outro';
    const resumo =
      primeiroTexto(entidade, ['resumo', 'Resumo', 'descricao', 'descrição']) ||
      '';
    const conteudo =
      primeiroTexto(entidade, ['conteudo', 'conteúdo', 'texto', 'Texto']) ||
      resumo;
    const capa =
      primeiroTexto(entidade, [
        'imagemCapa',
        'capa',
        'banner',
        'imagemUrl',
        'linkImagem',
        'foto',
        'image',
      ]) || '';
    const perfil =
      primeiroTexto(entidade, [
        'imagemPerfil',
        'perfil',
        'avatar',
        'imagemRetrato',
        'retrato',
        'fotoPerfil',
        'profileImage',
        'portrait',
        'fotoRetrato',
        'linkRetrato',
      ]) || '';
    const tags = normalizeNotaTags(entidade.tags);

    const atributos = normalizeEntityAttributes([
      entidade.atributos,
      entidade.attributes,
      entidade.propriedades,
    ]);

    const conexoes = [];
    const idsVistos = new Set();

    vinculos.forEach(vinculo => {
      const id = vinculo?.destinoId;
      if (!id || idsVistos.has(String(id))) return;
      idsVistos.add(String(id));
      conexoes.push({
        id,
        nome: vinculo.destinoNome || id,
        imagem: vinculo.destinoImagem || '',
        tipo:
          vinculo.tipoNome ||
          vinculo.destinoTipo ||
          vinculo.tipoCategoria ||
          '',
      });
    });

    [entidade.conexoes, entidade.connections, entidade.referencias].forEach(
      fonte => {
        if (!Array.isArray(fonte)) return;
        fonte.forEach(item => {
          const id = typeof item === 'string' ? item : item?.id;
          const nomeRelacionado =
            typeof item === 'string'
              ? ''
              : primeiroTexto(item, ['nome', 'titulo', 'Nome', 'Titulo']);
          if (!id || idsVistos.has(id)) return;
          idsVistos.add(id);
          conexoes.push({
            id,
            nome: nomeRelacionado || id,
            tipo:
              typeof item === 'object'
                ? primeiroTexto(item, ['tipo', 'Tipo'])
                : '',
          });
        });
      },
    );

    const createdAt =
      entidade.createdAt?.toDate?.() ?? entidade.createdAt ?? null;
    const updatedAt =
      entidade.updatedAt?.toDate?.() ?? entidade.updatedAt ?? null;

    return {
      nome,
      tipo,
      resumo,
      conteudo,
      capa,
      perfil,
      tags,
      atributos,
      conexoes,
      createdAt,
      updatedAt,
    };
  }, [entidade, vinculos]);

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (notFound || !dados) {
    return (
      <Paper
        elevation={0}
        sx={{
          maxWidth: 720,
          mx: 'auto',
          p: 3,
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 750 }}>
          Entidade não encontrada
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1, color: 'var(--text-secondary)' }}
        >
          O identificador pode ser inválido ou a entidade pode não pertencer à
          campanha ativa.
        </Typography>
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate(ROUTE_PATHS.UNIVERSO)}
          sx={{ mt: 2, textTransform: 'none' }}
        >
          Voltar à Wiki
        </Button>
      </Paper>
    );
  }

  const formatDate = value => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
      date,
    );
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate(ROUTE_PATHS.UNIVERSO)}
          sx={{
            color: 'var(--text-secondary)',
            textTransform: 'none',
            px: 0.5,
          }}
        >
          Wiki / {dados.tipo}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Button
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            onClick={() => navigate(`/universo/${entidadeId}/editar`)}
            sx={{
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #b84444 0%, #8f2f35 100%)',
              textTransform: 'none',
              fontWeight: 750,
            }}
          >
            Editar
          </Button>
          <IconButton
            aria-label="Mais ações"
            onClick={event => setMenuAnchor(event.currentTarget)}
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)',
            }}
          >
            <MoreHorizOutlinedIcon />
          </IconButton>
        </Box>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem disabled>Sem ações adicionais disponíveis</MenuItem>
      </Menu>

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          height: { xs: 280, sm: 330, md: 360 },
          overflow: 'visible',
          borderRadius: '16px',
          background:
            'linear-gradient(135deg, rgba(177,53,53,0.20), rgba(15,18,26,0.98) 58%)',
          mb: { xs: 8.5, sm: 8, md: 7 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {dados.capa ? (
            <Box
              component="img"
              src={dados.capa}
              alt=""
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 38%',
              }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 70% 30%, rgba(177,53,53,0.24), transparent 28%), linear-gradient(135deg, rgba(177,53,53,0.12), rgba(11,14,21,0.98) 70%)',
              }}
            />
          )}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(5,7,11,0.04) 25%, rgba(5,7,11,0.18) 58%, rgba(5,7,11,0.92) 100%)',
            }}
          />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            left: { xs: 18, md: 30 },
            right: { xs: 18, md: 30 },
            bottom: { xs: -68, sm: -64, md: -62 },
            zIndex: 2,
            display: 'flex',
            alignItems: 'flex-end',
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {dados.perfil ? (
            <Box
              component="img"
              src={dados.perfil}
              alt={dados.nome}
              sx={{
                width: { xs: 104, md: 128 },
                height: { xs: 104, md: 128 },
                flexShrink: 0,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '5px solid var(--bg-primary)',
                background: '#111827',
                boxShadow: '0 18px 38px rgba(0,0,0,0.48)',
              }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 104, md: 128 },
                height: { xs: 104, md: 128 },
                flexShrink: 0,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                border: '5px solid var(--bg-primary)',
                background: 'linear-gradient(135deg, #b84444, #20293a)',
                color: '#fff',
                fontFamily: 'Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                boxShadow: '0 18px 38px rgba(0,0,0,0.48)',
              }}
            >
              {monograma(dados.nome)}
            </Box>
          )}

          <Box sx={{ pb: { xs: 0.25, md: 0.5 }, minWidth: 0, pr: 1 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#efbcbc',
                fontWeight: 800,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
              }}
            >
              {dados.tipo}
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: '#fff',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3.15rem' },
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                fontWeight: 650,
                textShadow: '0 4px 18px rgba(0,0,0,0.66)',
                overflowWrap: 'anywhere',
              }}
            >
              {dados.nome}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 450px' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            minWidth: 0,
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15,18,26,0.94)',
            p: { xs: 2.25, md: 4 },
          }}
        >
          {dados.tags.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                flexWrap: 'wrap',
                mb: dados.resumo ? 2 : 3,
              }}
            >
              {dados.tags.map(tag => (
                <Box
                  key={tag}
                  sx={{
                    px: 1.1,
                    py: 0.45,
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                  }}
                >
                  {tag}
                </Box>
              ))}
            </Box>
          )}

          {dados.resumo && (
            <Typography
              sx={{
                mb: 3,
                color: 'rgba(237,239,244,0.78)',
                fontFamily: 'Georgia, serif',
                fontSize: { xs: '1.04rem', md: '1.12rem' },
                lineHeight: 1.72,
                borderLeft: '3px solid rgba(177,53,53,0.68)',
                pl: 2.25,
              }}
            >
              {dados.resumo}
            </Typography>
          )}

          <Box
            className="entidade-wiki-content"
            sx={{
              width: '100%',
              minWidth: 0,
              overflowWrap: 'anywhere',
              color: 'rgba(237,239,244,0.86)',
              fontSize: '1.02rem',
              lineHeight: 1.82,
              '& h1': {
                color: 'var(--text-primary)',
                fontFamily: 'Georgia, serif',
                fontSize: '2rem',
                lineHeight: 1.2,
                mt: 4,
                mb: 1.25,
              },
              '& h2': {
                color: 'var(--text-primary)',
                fontFamily: 'Georgia, serif',
                fontSize: '1.55rem',
                lineHeight: 1.25,
                mt: 3.25,
                mb: 1,
              },
              '& h3,& h4': {
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                mt: 2.5,
                mb: 0.75,
              },
              '& p': { mb: 1.5, overflow: 'visible' },
              '& h1,& h2,& h3,& h4': { width: '100%' },
              '& hr': {
                clear: 'both',
                border: 0,
                borderTop: '1px solid rgba(255,255,255,0.11)',
                my: 3,
              },
              '& blockquote': {
                borderLeft: '3px solid rgba(177,53,53,0.72)',
                marginLeft: 0,
                pl: 2.5,
                py: 0.5,
                color: 'var(--text-secondary)',
                fontFamily: 'Georgia, serif',
              },
              '& img': {
                maxWidth: '100%',
                borderRadius: '10px',
                objectFit: 'contain',
              },
              '& img[style*="float:left"]': {
                float: 'left',
                clear: 'none',
                marginTop: '16px',
                marginBottom: '16px',
                marginLeft: '0',
                marginRight: '32px',
              },
              '& img[style*="float:right"]': {
                float: 'right',
                clear: 'none',
                marginTop: '16px',
                marginBottom: '16px',
                marginLeft: '32px',
                marginRight: '0',
              },
              '@media (max-width:600px)': {
                '& img[style*="float:left"]': {
                  display: 'block',
                  float: 'left',
                  clear: 'none',
                },
                '& img[style*="float:right"]': {
                  display: 'block',
                  float: 'right',
                  clear: 'none',
                },
              },
              '& a': { color: '#efbcbc' },
              '& ul,& ol': { pl: 3, mb: 1.5 },
              '& table': { width: '100%', borderCollapse: 'collapse', my: 2 },
            }}
            dangerouslySetInnerHTML={{
              __html: renderNotaContentHtml(dados.conteudo),
            }}
          />
        </Paper>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            position: { lg: 'sticky' },
            top: { lg: 16 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15,18,26,0.94)',
              p: { xs: 1.5, md: 2.25 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Conexões
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'var(--text-secondary)' }}
              >
                {dados.conexoes.length}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.25 }} />
            {dados.conexoes.length ? (
              dados.conexoes.map(conexao => (
                <Box
                  key={conexao.id}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1,
                    py: 0.85,
                    mb: 0.75,
                    color: 'var(--text-primary)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.055)',
                    background: 'rgba(255,255,255,0.018)',
                    transition: 'all 0.18s ease',
                    '&:last-of-type': { mb: 0 },
                  }}
                >
                  {conexao.imagem ? (
                    <Box
                      component="img"
                      src={conexao.imagem}
                      alt=""
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: '#111827',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.10)',
                        background:
                          'linear-gradient(135deg, rgba(177,53,53,0.28), rgba(255,255,255,0.04))',
                        color: '#efbcbc',
                      }}
                    >
                      <LinkOutlinedIcon fontSize="small" />
                    </Box>
                  )}

                  <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1.35,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {conexao.nome}
                    </Typography>
                    {conexao.tipo && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'var(--text-secondary)' }}
                      >
                        {conexao.tipo}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))
            ) : (
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)', py: 1 }}
              >
                Nenhuma conexão cadastrada.
              </Typography>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15,18,26,0.94)',
              p: { xs: 1.5, md: 2.25 },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Atributos
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.25 }} />
            {dados.atributos.length ? (
              dados.atributos.map(atributo => (
                <Box
                  key={atributo.nome}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
                    alignItems: 'start',
                    gap: 1.25,
                    px: 1,
                    py: 0.9,
                    mb: 0.6,
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.055)',
                    background: 'rgba(255,255,255,0.018)',
                    '&:last-of-type': { mb: 0 },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    {atributo.nome}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      textAlign: 'right',
                      lineHeight: 1.45,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {atributo.valor}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)', py: 1 }}
              >
                Nenhum atributo cadastrado.
              </Typography>
            )}
          </Paper>

          {(dados.createdAt || dados.updatedAt) && (
            <Box sx={{ px: 0.5, color: 'var(--text-secondary)' }}>
              {dados.createdAt && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Criada em {formatDate(dados.createdAt)}
                </Typography>
              )}
              {dados.updatedAt && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Atualizada em {formatDate(dados.updatedAt)}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EntidadeWikiRedesign;
