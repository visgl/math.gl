import React from 'react';
import {Home} from '@vis.gl/docusaurus-website/components';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styled from 'styled-components';
import Layout from '@theme/Layout';

const TextContainer = styled.div`
max-width: 800px;
padding: 64px 112px;
font-size: 16px;

h2 {
  font: bold 32px/48px;
  margin: 24px 0 16px;
  position: relative;
}
h3 {
  font: bold 16px/24px;
  margin: 16px 0 0;
  position: relative;
}
div {
  display: flex;
  align-items: center;
  margin-top: 1em;
}
div > img {
  width: 36px;
  margin-right: 1em;
}
hr {
  border: none;
  background: #E1E8F0;
  height: 1px;
  margin: 24px 0 0;
  width: 32px;
  height: 2px;
}
@media screen and (max-width: 768px) {
  max-width: 100%;
  width: 100%;
  padding: 48px 48px 48px 80px;
}
`;

export default function IndexPage() {
  const baseUrl = useBaseUrl('/');

  return (
    <Layout title="Home" description="math.gl">
      <>
        <Home getStartedLink="./docs/developer-guide/get-started" />
        <TextContainer>
          <h2>
            A collection of math modules for Geospatial and 3D use cases.
          </h2>
          <hr className="short" />

          <div>
            <img src={`${baseUrl}images/icon-layers.svg`} />
            Toolbox of 3D math modules
          </div>

          <div>
            <img src={`${baseUrl}images/icon-high-precision.svg`} />
            Matrices and vectors, bounding boxes, frustum culling etc
          </div>
          
          <div>
          <img src={`${baseUrl}images/icon-basemap.webp`} />
            Geospatial reprojection, gravity models, solar position, etc
          </div>

          <div>
          <img src={`${baseUrl}images/icon-typescript.svg`} />
            Strict TypeScript and run-time checks that detect bad data
          </div>

        </TextContainer>
      </>
    </Layout>
  );
}
