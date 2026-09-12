import { createMDX } from 'fumadocs-mdx/next';
import path from 'path';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath: '/Burni',
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname
  }
};

export default withMDX(config);
