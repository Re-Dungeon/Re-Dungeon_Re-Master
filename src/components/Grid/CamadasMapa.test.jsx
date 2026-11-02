import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import ParedesCamada from './ParedesCamada';
import NevoaCamada from './NevoaCamada';
import CamadaAnotacoes from './CamadaAnotacoes';

const config = { celula: 50, deslocamentoX: 0, deslocamentoY: 0 };
const limites = { colunas: 10, linhas: 8 };

describe('ParedesCamada', () => {
  it('não renderiza sem paredes', () => {
    const { container } = render(
      <ParedesCamada
        config={config}
        bloqueadas={new Set()}
        limites={limites}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('desenha o preenchimento e o contorno externo', () => {
    const { container } = render(
      <ParedesCamada
        config={config}
        bloqueadas={new Set(['1,1', '2,1'])}
        limites={limites}
      />,
    );
    expect(container.querySelector('[data-camada="paredes"]')).not.toBeNull();
    expect(container.querySelector('pattern')).not.toBeNull();
    // Duas células lado a lado: topo e base fundidos + duas laterais.
    expect(container.querySelectorAll('svg > line').length).toBe(4);
  });
});

describe('NevoaCamada', () => {
  it('some para o jogador com a névoa desligada', () => {
    const { container } = render(
      <NevoaCamada
        config={config}
        limites={limites}
        nevoa={{ ativa: false, reveladas: new Set() }}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('jogador: preto opaco com buraco evenodd nas reveladas', () => {
    const { container } = render(
      <NevoaCamada
        config={config}
        limites={limites}
        nevoa={{ ativa: true, reveladas: new Set(['0,0']) }}
      />,
    );
    const path = container.querySelector('path');
    expect(path.getAttribute('fill')).toBe('#000');
    expect(path.getAttribute('fill-rule')).toBe('evenodd');
    expect(path.getAttribute('d')).toContain('M 0 0 h 50 v 50 h -50 z');
  });

  it('mestre: com a névoa desligada, só a prévia', () => {
    const nevoa = { ativa: false, reveladas: new Set() };
    const semPreview = render(
      <NevoaCamada config={config} limites={limites} nevoa={nevoa} mestre />,
    );
    expect(semPreview.container.querySelector('svg')).toBeNull();
    const comPreview = render(
      <NevoaCamada
        config={config}
        limites={limites}
        nevoa={nevoa}
        mestre
        preview
      />,
    );
    expect(
      comPreview.container.querySelector('path').getAttribute('fill'),
    ).toBe('rgba(0, 0, 0, 0.2)');
  });
});

describe('CamadaAnotacoes', () => {
  it('desenha traços, traço em curso, prévia e filhos', () => {
    const { container } = render(
      <CamadaAnotacoes
        config={config}
        limites={limites}
        desenhos={[{ id: 'd1', cor: '#ffffff', pontos: [0, 0, 10, 10] }]}
        tracoAtual={{
          cor: '#e05555',
          pontos: [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
          ],
        }}
        previaCelulas={{ celulas: new Set(['1,1', '2,1']), acao: 'apagar' }}
      >
        <circle data-filho="" />
      </CamadaAnotacoes>,
    );
    expect(
      container
        .querySelector('[data-desenho="d1"] polyline')
        .getAttribute('points'),
    ).toBe('0,0 10,10');
    expect(
      container
        .querySelector('[data-traco-atual] polyline')
        .getAttribute('points'),
    ).toBe('1,2 3,4');
    const rects = container.querySelectorAll('rect[data-previa="apagar"]');
    expect(rects.length).toBe(1);
    expect(rects[0].getAttribute('width')).toBe('100');
    expect(container.querySelector('[data-filho]')).not.toBeNull();
  });
});
