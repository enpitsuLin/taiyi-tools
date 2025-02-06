import { Asset, Price } from '../src'

describe('asset', () => {
  // 测试 fromString 方法
  describe('fromString', () => {
    it('should parse normal asset string correctly', () => {
      const asset = Asset.fromString('42.000 QI')
      expect(asset.amount).toBe(42)
      expect(asset.symbol).toBe('QI')
      expect(asset.isFai).toBe(false)
    })

    it('should parse fai asset string correctly', () => {
      const asset = Asset.fromString('42.000 @@000000021')
      expect(asset.amount).toBe(42)
      expect(asset.symbol).toBe('YANG')
      expect(asset.isFai).toBe(true)
    })

    it('should throw error when symbol is invalid', () => {
      expect(() => Asset.fromString('42.000 XXX')).toThrow('Invalid asset symbol')
    })
  })

  // 测试 from 方法
  describe('from', () => {
    it('should create asset from number', () => {
      const asset = Asset.from(42, 'QI')
      expect(asset.amount).toBe(42)
      expect(asset.symbol).toBe('QI')
    })

    it('should create asset from FaiAsset object', () => {
      const asset = Asset.from({
        amount: '42',
        precision: 6,
        fai: '@@000000037',
      })
      expect(asset.amount).toBe(42)
      expect(asset.symbol).toBe('QI')
      expect(asset.isFai).toBe(true)
    })
  })

  // 测试数学运算方法
  describe('math operations', () => {
    const asset1 = new Asset(100, 'QI')
    const asset2 = new Asset(50, 'QI')

    it('should execute addition correctly', () => {
      const result = asset1.add(asset2)
      expect(result.amount).toBe(150)
      expect(result.symbol).toBe('QI')
    })

    it('should execute subtraction correctly', () => {
      const result = asset1.subtract(asset2)
      expect(result.amount).toBe(50)
      expect(result.symbol).toBe('QI')
    })

    it('should throw error when adding assets with different symbols', () => {
      const yangAsset = new Asset(100, 'YANG')
      expect(() => asset1.add(yangAsset))
        .toThrow('Invalid asset, expected symbol: QI got: YANG')
    })
  })

  describe('string conversion', () => {
    it('toString should return correct format', () => {
      const asset = new Asset(42.123456, 'QI')
      expect(asset.toString()).toBe('42.123456 QI')
    })

    it('toJSON should return correct format', () => {
      const asset = new Asset(42, 'YANG', true)
      const json = JSON.parse(asset.toJSON())
      expect(json).toEqual({
        amount: 42,
        precision: 3,
        fai: '@@000000021',
      })
    })
  })
})

describe('price', () => {
  it('should create price pair correctly', () => {
    const base = new Asset(1, 'YANG')
    const quote = new Asset(100, 'QI')
    const price = new Price(base, quote)
    expect(price.toString()).toBe('1.000 YANG:100.000000 QI')
  })

  it('should convert asset correctly', () => {
    const base = new Asset(1, 'YANG')
    const quote = new Asset(100, 'QI')
    const price = new Price(base, quote)

    const yangAsset = new Asset(2, 'YANG')
    const converted = price.convert(yangAsset)
    expect(converted.amount).toBe(200)
    expect(converted.symbol).toBe('QI')
  })

  it('should throw error when base and quote have the same symbol', () => {
    const base = new Asset(1, 'QI')
    const quote = new Asset(100, 'QI')
    expect(() => new Price(base, quote)).toThrow('base and quote can not have the same symbol')
  })
})
