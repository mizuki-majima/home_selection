import { describe, expect, it } from 'vitest';
import { computeVolume, setbackDepth, ZONES } from '../../src/lib/volume';

describe('建てられるボリューム', () => {
  it('例A：150㎡・第一種低層（50%・100%）・道路6m → 延べ150㎡', () => {
    const r = computeVolume({ siteArea: 150, zone: 'r1l', bcr: 50, far: 100, roadWidth: 6, frontage: 10, corner: false });
    expect(r.maxBuildingArea).toBe(75);
    expect(r.maxFloorArea).toBe(150);
    expect(r.limiter).toBe('designated');
  });

  it('例B：150㎡・第一種住居（60%・200%）・道路4m → 道路の制限160%で240㎡', () => {
    const r = computeVolume({ siteArea: 150, zone: 'r1', bcr: 60, far: 200, roadWidth: 4, frontage: 10, corner: false });
    expect(r.roadFar).toBe(160);
    expect(r.farApplied).toBe(160);
    expect(r.limiter).toBe('road');
    expect(r.maxFloorArea).toBeCloseTo(240, 5);
  });

  it('例C：幅3mの2項道路・間口10m → 0.5m後退で5㎡を除き、道路幅は4mとして計算', () => {
    const r = computeVolume({ siteArea: 150, zone: 'r1', bcr: 60, far: 200, roadWidth: 3, frontage: 10, corner: false });
    expect(r.setbackDepth).toBe(0.5);
    expect(r.setbackArea).toBe(5);
    expect(r.effectiveSite).toBe(145);
    expect(r.farApplied).toBe(160);
    expect(r.maxFloorArea).toBeCloseTo(232, 5);
  });

  it('道路幅12mで道路の制限が外れる（切替点）', () => {
    const below = computeVolume({ siteArea: 100, zone: 'c', bcr: 80, far: 800, roadWidth: 11.9, frontage: 10, corner: false });
    const at = computeVolume({ siteArea: 100, zone: 'c', bcr: 80, far: 800, roadWidth: 12, frontage: 10, corner: false });
    expect(below.roadFar).toBeCloseTo(714, 5);
    expect(below.limiter).toBe('road');
    expect(at.roadFar).toBeNull();
    expect(at.farApplied).toBe(800);
  });

  it('道路の制限と指定容積率が等しいときは指定のほうが効いている扱い', () => {
    const r = computeVolume({ siteArea: 100, zone: 'r1m', bcr: 60, far: 200, roadWidth: 5, frontage: 10, corner: false });
    expect(r.roadFar).toBe(200);
    expect(r.limiter).toBe('designated');
  });

  it('角地は建ぺい率+10%', () => {
    const r = computeVolume({ siteArea: 100, zone: 'r1l', bcr: 50, far: 100, roadWidth: 6, frontage: 10, corner: true });
    expect(r.bcrApplied).toBe(60);
    expect(r.maxBuildingArea).toBe(60);
  });

  it('接道2m未満・工業専用地域は建てられない', () => {
    expect(computeVolume({ siteArea: 100, zone: 'r1', bcr: 60, far: 200, roadWidth: 4, frontage: 1.9, corner: false }).buildable).toBe(false);
    expect(computeVolume({ siteArea: 100, zone: 'ie', bcr: 60, far: 200, roadWidth: 6, frontage: 10, corner: false }).buildable).toBe(false);
  });

  it('セットバックの深さ', () => {
    expect(setbackDepth(4)).toBe(0);
    expect(setbackDepth(2.7)).toBeCloseTo(0.65, 5);
  });

  it('用途地域は13種類', () => {
    expect(ZONES).toHaveLength(13);
  });
});
