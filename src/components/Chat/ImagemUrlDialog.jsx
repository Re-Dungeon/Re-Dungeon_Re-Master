import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import { isUrlImagemValida } from 'common/utils/chat';
import {
  comprimirImagem,
  validarArquivoImagem,
  validarTamanhoImagem,
} from 'common/utils/imagemUpload';
import { enviarImagemUpload, uploadImagemDisponivel } from 'service/uploadImagem';

import { PreviewImagem, UploadLinha } from './styles';

const AJUDA =
  'Cole o endereço direto da imagem ou GIF (botão direito → "Copiar endereço da imagem"). ' +
  'Links de página como tenor.com/view/... não funcionam.';

const AVISO_HOSPEDAGEM =
  'A imagem fica hospedada no Cloudinary; qualquer pessoa com o link pode vê-la.';

// Prévia do arquivo escolhido (data URL lida em segundo plano). Só vale a do
// arquivo atual: trocar ou limpar o arquivo descarta a anterior.
const usePreviaArquivo = arquivo => {
  const [lida, setLida] = useState(null);
  useEffect(() => {
    if (!arquivo) return undefined;
    let ativo = true;
    const leitor = new FileReader();
    leitor.onload = () => {
      if (ativo) setLida({ arquivo, url: leitor.result });
    };
    leitor.readAsDataURL(arquivo);
    return () => {
      ativo = false;
      leitor.abort();
    };
  }, [arquivo]);
  return arquivo && lida?.arquivo === arquivo ? lida.url : null;
};

// Imagem por link ou, com o upload configurado (service/uploadImagem.js), por
// arquivo do PC. `arquivoInicial` vem de Ctrl+V/arrastar no ChatSala; nada
// sobe antes do "Enviar".
const ImagemUrlDialog = ({
  open,
  onClose,
  onConfirmar,
  arquivoInicial = null,
  avisoInicial = null,
}) => {
  const [url, setUrl] = useState('');
  const [tocado, setTocado] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const inputArquivoRef = useRef(null);
  const abortRef = useRef(null);
  const podeArquivo = uploadImagemDisponivel();

  // Novo arquivo vindo de fora (colar/soltar) substitui o que estava escolhido.
  const [arquivoInicialVisto, setArquivoInicialVisto] = useState(null);
  if (open && arquivoInicial !== arquivoInicialVisto) {
    setArquivoInicialVisto(arquivoInicial);
    if (arquivoInicial) {
      const validacao = validarArquivoImagem(arquivoInicial);
      setArquivo(validacao.ok ? arquivoInicial : null);
      setErro(validacao.erro);
      setAviso(avisoInicial);
    }
  }

  const previaArquivo = usePreviaArquivo(open ? arquivo : null);

  const urlValida = isUrlImagemValida(url);
  const mostrarErroUrl = !arquivo && tocado && url.trim() !== '' && !urlValida;
  const podeEnviar = !enviando && (arquivo ? true : urlValida);

  const limpar = () => {
    setUrl('');
    setTocado(false);
    setArquivo(null);
    setAviso(null);
    setErro(null);
    setArquivoInicialVisto(null);
  };

  const fechar = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setEnviando(false);
    limpar();
    onClose();
  };

  const escolherArquivo = event => {
    const escolhido = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!escolhido) return;
    const validacao = validarArquivoImagem(escolhido);
    setArquivo(validacao.ok ? escolhido : null);
    setErro(validacao.erro);
    setAviso(null);
  };

  const subirArquivo = async () => {
    // O controle nasce antes da compressão: "Cancelar" durante ela também
    // impede o envio.
    const controle = new AbortController();
    abortRef.current = controle;
    try {
      const preparado = await comprimirImagem(arquivo);
      if (controle.signal.aborted) throw new DOMException('Cancelado', 'AbortError');
      const tamanho = validarTamanhoImagem(preparado);
      if (!tamanho.ok) throw new Error(tamanho.erro);
      return await enviarImagemUpload(preparado, { signal: controle.signal });
    } finally {
      if (abortRef.current === controle) abortRef.current = null;
    }
  };

  const confirmar = async event => {
    event.preventDefault();
    setTocado(true);
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);
    let link;
    try {
      link = arquivo ? await subirArquivo() : url.trim();
    } catch (falha) {
      // Cancelado pelo "Cancelar" (fechar já limpou tudo).
      if (falha?.name === 'AbortError') return;
      setErro(falha?.message || 'Não foi possível enviar a imagem.');
      setEnviando(false);
      return;
    }
    try {
      await onConfirmar(link);
      limpar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={fechar} fullWidth maxWidth="sm">
      <form onSubmit={confirmar} noValidate>
        <DialogTitle>Enviar imagem ou GIF</DialogTitle>
        <DialogContent>
          {podeArquivo && (
            <>
              <UploadLinha>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileOutlinedIcon />}
                  onClick={() => inputArquivoRef.current?.click()}
                  disabled={enviando}
                >
                  Escolher do PC
                </Button>
                {arquivo && (
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', minWidth: 0, overflowWrap: 'anywhere' }}>
                    {arquivo.name || 'Imagem colada'}
                  </Typography>
                )}
                {arquivo && !enviando && (
                  <Button size="small" onClick={() => setArquivo(null)}>
                    Usar link
                  </Button>
                )}
              </UploadLinha>
              <input
                ref={inputArquivoRef}
                type="file"
                accept="image/*"
                hidden
                onChange={escolherArquivo}
                data-testid="imagem-arquivo"
              />
              <Typography variant="caption" component="p" sx={{ color: 'var(--text-muted)', mt: 0.75 }}>
                {AVISO_HOSPEDAGEM} Você também pode colar (Ctrl+V) ou arrastar a imagem no chat.
              </Typography>
            </>
          )}
          {!arquivo && (
            <TextField
              fullWidth
              margin="dense"
              label="URL da imagem"
              value={url}
              onChange={event => setUrl(event.target.value)}
              onBlur={() => setTocado(true)}
              error={mostrarErroUrl}
              disabled={enviando}
              helperText={
                mostrarErroUrl ? 'URL inválida: use um link https direto para .gif/.png/.jpg/.webp' : AJUDA
              }
            />
          )}
          {aviso && (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              {aviso}
            </Alert>
          )}
          {erro && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {erro}
            </Alert>
          )}
          {arquivo && previaArquivo && <PreviewImagem src={previaArquivo} alt="Pré-visualização" />}
          {!arquivo && urlValida && (
            <PreviewImagem src={url.trim()} alt="Pré-visualização" referrerPolicy="no-referrer" />
          )}
          {enviando && arquivo && (
            <LinearProgress sx={{ mt: 1.5 }} aria-label="Enviando a imagem" />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={fechar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={!podeEnviar}>
            {enviando && arquivo ? 'Enviando…' : 'Enviar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

ImagemUrlDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirmar: PropTypes.func.isRequired,
  // Arquivo colado/arrastado no chat (abre direto na prévia).
  arquivoInicial: PropTypes.object,
  // Aviso mostrado junto do `arquivoInicial` (ex.: "Envie uma imagem por vez").
  avisoInicial: PropTypes.string,
};

export default ImagemUrlDialog;
