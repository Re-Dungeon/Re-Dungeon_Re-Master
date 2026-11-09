import { useCallback, useEffect, useRef, useState } from 'react';
import { setGridCamada } from 'service/storage';
import {
  dadosDoSnapshot,
  edicaoMudaCamada,
  empilharDesfazer,
  snapshotDaCamada,
} from './gridMestre';

const SEM_ITENS = [];

/**
 * Desfazer das camadas do mapa (paredes e névoa) do mestre: guarda, só nesta
 * aba, o estado anterior de cada edição (as últimas DESFAZER_CAMADAS_MAX, por
 * cena) e volta a ele regravando a camada inteira (`setGridCamada`, o mesmo
 * documento que useGridCamadas escreve). `editar` e `preencher` envolvem
 * `editarCamada`/`preencherCamada` do useGridCampanha. Ligar/desligar a névoa
 * não entra no desfazer. `tentar(acao, erro)` mostra a falha no Snackbar.
 */
const useDesfazerCamadas = ({
  campanhaId,
  cenaId,
  camadas,
  editarCamada,
  preencherCamada,
  tentar,
}) => {
  const [estado, setEstado] = useState({ cenaId: null, itens: SEM_ITENS });
  const itens = estado.cenaId === cenaId ? estado.itens : SEM_ITENS;
  // Leitura nos callbacks sem recriá-los a cada render.
  const camadasRef = useRef(camadas);
  const itensRef = useRef(itens);
  const contadorRef = useRef(0);
  const desfazendoRef = useRef(false);
  useEffect(() => {
    camadasRef.current = camadas;
    itensRef.current = itens;
  });

  const empilhar = useCallback(
    entrada =>
      setEstado(atual => ({
        cenaId,
        itens: empilharDesfazer(
          atual.cenaId === cenaId ? atual.itens : SEM_ITENS,
          entrada,
        ),
      })),
    [cenaId],
  );

  const retirar = useCallback(
    id =>
      setEstado(atual => ({
        ...atual,
        itens: atual.itens.filter(item => item.id !== id),
      })),
    [],
  );

  // Guarda o estado de agora e executa a edição; se ela falhar, o passo sai.
  const comPasso = useCallback(
    async (camada, muda, executar) => {
      const antes = snapshotDaCamada(camada, camadasRef.current);
      if (!muda(antes.celulas)) return executar();
      contadorRef.current += 1;
      const entrada = { ...antes, id: contadorRef.current };
      empilhar(entrada);
      const ok = await executar();
      if (!ok) retirar(entrada.id);
      return ok;
    },
    [empilhar, retirar],
  );

  const editar = useCallback(
    (camada, acao, celulas, limites) =>
      comPasso(
        camada,
        atuais => edicaoMudaCamada(atuais, acao, celulas, limites),
        () => editarCamada(camada, acao, celulas, limites),
      ),
    [comPasso, editarCamada],
  );

  const preencher = useCallback(
    (camada, acao, limites) =>
      comPasso(
        camada,
        () => true,
        () => preencherCamada(camada, acao, limites),
      ),
    [comPasso, preencherCamada],
  );

  const desfazer = useCallback(async () => {
    const topo = itensRef.current[itensRef.current.length - 1];
    if (!topo || !campanhaId || !cenaId || desfazendoRef.current) return false;
    desfazendoRef.current = true;
    try {
      const ok = await tentar(
        () =>
          setGridCamada(
            campanhaId,
            cenaId,
            topo.camada,
            dadosDoSnapshot(topo, camadasRef.current),
          ).then(() => true),
        'Não foi possível desfazer.',
      );
      if (ok) retirar(topo.id);
      return Boolean(ok);
    } finally {
      desfazendoRef.current = false;
    }
  }, [campanhaId, cenaId, retirar, tentar]);

  return { editar, preencher, desfazer, podeDesfazer: itens.length > 0 };
};

export default useDesfazerCamadas;
