import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ROUTE_PATHS } from 'common/constants/routes';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import { getRmNota } from 'service/storage';
import {
  getNotaCapa,
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

const EntidadeWiki = () => {
  const navigate = useNavigate();
  const { entidadeId } = useParams();
  const { campanhaAtiva } = useCampanha();
  const { notifyError } = useSnackbar();
  const [entidade, setEntidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
          setNotFound(true);
          return;
        }

        if (
          campanhaAtiva?.id &&
          loaded.campanhaId &&
          loaded.campanhaId !== campanhaAtiva.id
        ) {
          setEntidade(null);
          setNotFound(true);
          return;
        }

        setEntidade(loaded);
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
  }, [campanhaAtiva?.id, entidadeId, notifyError]);

  const dados = useMemo(() => {
    if (!entidade) return null;
    const nome =
      primeiroTexto(entidade, ['titulo', 'Titulo', 'nome', 'Nome']) ||
      'Sem título';
    const tipo =
      primeiroTexto(entidade, ['tipo', 'categoria', 'Tipo']) || 'Outro';
    const resumo =
      primeiroTexto(entidade, ['resumo', 'Resumo']) ||
      primeiroTexto(entidade, ['descricao', 'descrição']) ||
      '';
    const conteudo =
      primeiroTexto(entidade, ['conteudo', 'conteúdo', 'texto', 'Texto']) ||
      resumo;
    const capa =
      primeiroTexto(entidade, ['imagemCapa', 'capa', 'banner']) ||
      primeiroTexto(entidade, ['imagemUrl', 'linkImagem', 'foto', 'image']) ||
      getNotaCapa(entidade);
    const perfil =
      primeiroTexto(entidade, ['imagemPerfil', 'perfil', 'avatar']) || '';
    const tags = normalizeNotaTags(entidade.tags);

    const atributos = [];
    const fontesAtributos = [
      entidade.atributos,
      entidade.attributes,
      entidade.propriedades,
    ];
    fontesAtributos.forEach(fonte => {
      if (!fonte || typeof fonte !== 'object' || Array.isArray(fonte)) return;
      Object.entries(fonte).forEach(([chave, valor]) => {
        if (valor === null || valor === undefined || valor === '') return;
        atributos.push({
          nome: chave,
          valor:
            typeof valor === 'object' ? JSON.stringify(valor) : String(valor),
        });
      });
    });

    const fontesConexoes = [
      entidade.conexoes,
      entidade.connections,
      entidade.referencias,
    ];
    const conexoes = [];
    const idsVistos = new Set();
    fontesConexoes.forEach(fonte => {
      if (!Array.isArray(fonte)) return;
      fonte.forEach(item => {
        const id = typeof item === 'string' ? item : item?.id;
        const nome =
          typeof item === 'string'
            ? ''
            : primeiroTexto(item, ['nome', 'titulo', 'Nome', 'Titulo']);
        if (!id || idsVistos.has(id)) return;
        idsVistos.add(id);
        conexoes.push({ id, nome: nome || id });
      });
    });

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
    };
  }, [entidade]);

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

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate(ROUTE_PATHS.UNIVERSO)}
          sx={{ color: 'var(--text-secondary)', textTransform: 'none' }}
        >
          Wiki / {dados.tipo}
        </Button>
        <Button
          variant="contained"
          startIcon={<EditOutlinedIcon />}
          onClick={() => navigate(`/universo/${entidadeId}/editar`)}
          sx={{
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #b84444 0%, #8f2f35 100%)',
            textTransform: 'none',
            fontWeight: 750,
          }}
        >
          Editar
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          minHeight: 260,
          overflow: 'hidden',
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'linear-gradient(135deg, rgba(177,53,53,0.14), rgba(15,18,26,0.98) 52%)',
          mb: 2,
        }}
      >
        {dados.capa && (
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
              opacity: 0.42,
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(7,9,14,0.96), rgba(7,9,14,0.48) 58%, rgba(7,9,14,0.78)), linear-gradient(180deg, transparent 45%, rgba(7,9,14,0.74))',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            minHeight: 260,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2.5,
            p: { xs: 2.5, md: 4 },
          }}
        >
          {dados.perfil ? (
            <Box
              component="img"
              src={dados.perfil}
              alt={dados.nome}
              sx={{
                width: { xs: 88, md: 112 },
                height: { xs: 112, md: 142 },
                flexShrink: 0,
                objectFit: 'cover',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: '0 16px 32px rgba(0,0,0,0.38)',
              }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 88, md: 112 },
                height: { xs: 112, md: 142 },
                flexShrink: 0,
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid rgba(255,255,255,0.12)',
                background:
                  'linear-gradient(135deg, rgba(177,53,53,0.24), rgba(255,255,255,0.025))',
                color: '#f1cccc',
                fontFamily: 'Georgia, serif',
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              {dados.nome.slice(0, 2).toUpperCase()}
            </Box>
          )}
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: '#efbcbc',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {dados.tipo}
            </Typography>
            <Typography
              component="h1"
              sx={{
                mt: 0.5,
                maxWidth: 800,
                color: '#fff',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: { xs: '2rem', md: '3.25rem' },
                lineHeight: 1,
                fontWeight: 650,
                letterSpacing: '-0.035em',
                textShadow: '0 4px 22px rgba(0,0,0,0.72)',
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
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 280px' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15,18,26,0.94)',
            p: { xs: 2.5, md: 4 },
          }}
        >
          {dados.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
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

          <Box
            className="entidade-wiki-content"
            sx={{
              maxWidth: 920,
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15,18,26,0.94)',
              p: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Conexões
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.25 }} />
            {dados.conexoes.length ? (
              dados.conexoes.map(conexao => (
                <Box
                  key={conexao.id}
                  sx={{
                    width: '100%',
                    px: 1,
                    py: 0.75,
                    color: 'var(--text-primary)',
                    borderRadius: 2,
                  }}
                >
                  {conexao.nome}
                </Box>
              ))
            ) : (
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                Nenhuma conexão cadastrada.
              </Typography>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15,18,26,0.94)',
              p: 2,
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
                    gridTemplateColumns: '1fr auto',
                    gap: 1,
                    py: 0.65,
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
                    }}
                  >
                    {atributo.valor}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                Nenhum atributo cadastrado.
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default EntidadeWiki;
