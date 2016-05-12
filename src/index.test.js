'use strict';
//os-types => obeu-types
//os_types => obeu_types
//osTypes => obeuTypes
//osType => obeuType
//'value' => 'amount'
import {expect} from 'chai';
import TypeProcessor from './index';
import _ from 'lodash';

describe('obeu-types', function() {
  var tp = new TypeProcessor();
  describe('getAllTypes', function () {
    it('should be an array of strings', function () {
      expect(tp.getAllTypes()).to.satisfy(isArrayOfStrings);

      function isArrayOfStrings(array) {
        return array.every(function (item) {
          return typeof item === 'string';
        });
      }
    });

    it('should contain `administrative-classification:dimension:level1:label`', function () {
      expect(tp.getAllTypes()).to.include('administrative-classification:dimension:level1:label');
    });
  });

  describe('autoComplete', function () {
    it('autocompletes the empty string', function () {
      var allPrefixes = _.uniq(_.map(tp.getAllTypes(), (typ) => {
        return typ.split(':')[0] + (_.includes(typ, ':') ? ':' : '');
      }));
      expect(tp.autoComplete('')).to.eql(allPrefixes);
    });
    it('autocompletes a simple string', function () {
      var allPrefixes =
        _.uniq(
          _.map(
            _.filter(tp.getAllTypes(), (typ) => {
              return _.startsWith(typ, 'a');
            }), (typ) => {
              return typ.split(':')[0] + (_.includes(typ, ':') ? ':' : '');
            }));
      expect(tp.autoComplete('a')).to.eql(allPrefixes);
    });
    it('autocompletes a simple : ending string', function () {
      var allPrefixes =
        _.uniq(
          _.map(
            _.filter(tp.getAllTypes(), (typ) => {
              return _.startsWith(typ, 'functional-classification:');
            }), (typ) => {
              return 'functional-classification:' + typ.split(':')[1] + (_.includes(typ, ':') ? ':' : '');
            }));
      expect(tp.autoComplete('functional-classification:')).to.eql(allPrefixes);
    });
    it('autocompletes a complex non : ending string', function () {
      expect(tp.autoComplete('functional-classification:dimension:co'))
        .to.eql(['functional-classification:dimension:code:']);
    });
    it('autocompletes with leaves and non leaves', function () {
      expect(tp.autoComplete('operationCharacter:dimension:'))
        .to.eql(['operationCharacter:dimension:expenditure',
                 'operationCharacter:dimension:revenue',
                 ]);
    });
  });

  describe('fieldsToModel', function () {
    it('detects invalid objects', function () {
      var invalids = [null,
        5,
        {}
          [{}],
        [{title: 'moshe'}],
        [{type: 'programm-classification:dimension:code'}],
        [{type: 'moshe', name: 'miko'}],
        ["arr"],
        [{type: 'programm-classification:dimension:code', name: 'aaa', extra: 'bbb'}],
        [{type: 'programm-classification:dimension:code', name: 'aaa', options: {'bbb': 1}}]
      ];
      invalids.forEach((s) => {
        expect(tp.fieldsToModel(s).errors).to.be.ok;
      });
    });
    it('returns non null for valid objects', function () {
      var valids = [
        [{type: 'programm-classification:dimension:code:full', name: 'hello world'}],
        [{type: '', name: 'hello world'}],
        [{type: null, name: 'hello world'}]
      ];
      valids.forEach((s) => {
        expect(tp.fieldsToModel(s).schema).to.be.ok;
      });
    });
    it('slugifies correctly titles', function () {
      var title_pairs = [
        [['hello_world', 'hello_world']],
        [['hello-world', 'hello_world']],
        [['hello world', 'hello_world']],
        [['héllô₪wörld', 'hello_world']],
        [['שלום עולם', 'prgrmm_clssfctn_dmnsn_cd_fll']],
        [['שלום עולם', 'prgrmm_clssfctn_dmnsn_cd_fll'], ['אכלת פלפל', 'fnctnl_clssfctn_dmnsn_lvl3_cd_fll'], ['שתה מיץ', 'dmnstrtv_clssfctn_dmnsn_lvl4_cd_fll']],
        [['שלום עולם', 'prgrmm_clssfctn_dmnsn_cd_fll'],
          ['prgrmm_clssfctn_dmnsn_cd_fll', 'prgrmm_clssfctn_dmnsn_cd_fll_2'],
          ['prgrmm_clssfctn_dmnsn_cd_fll_2', 'prgrmm_clssfctn_dmnsn_cd_fll_2_2']]
      ];
      var types = [
        'programm-classification:dimension:code:full',
        'functional-classification:dimension:level3:code:full',
        'administrative-classification:dimension:level4:code:full'
      ];
      title_pairs.forEach((titles) => {
        let s = [];
        for (let i = 0; i < titles.length; i++) {
          s.push({type: types[i], name: titles[i][0]});
        }
        var model = tp.fieldsToModel(s);
        expect(model).to.not.equal(null);
        var schema = model.schema;
        titles.forEach((pair) => {
          expect(schema.fields[pair[0]].slug).to.equal(pair[1]);
        });
      });
    });
    it('prevents correctly ducplicates', function () {
      var title_pairs = [
        [['אבא', 'prgrmm_clssfctn_dmnsn_cd_fll'],
          ['אמא', 'prgrmm_clssfctn_dmnsn_cd_fll_2'],
          ['במבה', 'prgrmm_clssfctn_dmnsn_cd_fll_3']]
      ];
      var types = [
        'programm-classification:dimension:code:full',
        'programm-classification:dimension:code:full',
        'programm-classification:dimension:code:full'
      ];
      title_pairs.forEach((titles) => {
        let s = [];
        for (let i = 0; i < titles.length; i++) {
          s.push({type: types[i], name: titles[i][0]});
        }
        var model = tp.fieldsToModel(s);
        expect(model).to.not.equal(null);
        var schema = model.schema;
        titles.forEach((pair) => {
          expect(schema.fields[pair[0]].slug).to.equal(pair[1]);
        });
      });
    });
    it('creates correctly dimensions & measures', function () {
      var fields = _.map(tp.getAllTypes(), (type) => {
        var name = type.replace(/:/g, ' ');
        return {name, type};
      });
      var ret = tp.fieldsToModel(fields);
      expect(ret).to.not.equal(null);
      var model = ret.model;
      expect(model).to.be.ok;
      expect(model.dimensions).to.be.ok;
      expect(model.measures).to.be.ok;
      _.forEach(_.values(ret.schema.fields), (field) => {
      //  if (field.conceptType != 'value') {
          expect(model.dimensions[field.conceptType]).to.be.ok;
          var attr = model.dimensions[field.conceptType].attributes[field.slug];
          expect(attr).to.be.ok;
          expect(attr.source).to.equal(field.name);
          expect(attr.title).to.equal(field.title);
          expect(attr.resource).to.equal(field.resource);
       /* } else {
        	expect(model.measures[field.name]).to.be.ok;
         
        }
        */
      });
    });
    it('adds correctly labelfor and parent', function () {
      var fields = [
        {type: 'economic-classification:dimension:level1:label', name: 'lvl1-label'},
        {type: 'economic-classification:dimension:level1:code', name: 'lvl1-code'},
        {type: 'economic-classification:dimension:level2:code', name: 'lvl2-code'},
        {type: 'economic-classification:dimension:level2:label', name: 'lvl2-label'}
      ];
      var ret = tp.fieldsToModel(fields);
      expect(ret).to.not.equal(null);
      var model = ret.model;
      var schema = ret.schema.fields;
      expect(model).to.be.ok;
      expect(model.dimensions).to.be.ok;
      expect(model.dimensions['economic-classification']
        .attributes[schema['lvl1-label'].slug].labelfor)
        .to.be.equal(schema['lvl1-code'].slug);
      expect(model.dimensions['economic-classification']
        .attributes[schema['lvl2-label'].slug].labelfor)
        .to.be.equal(schema['lvl2-code'].slug);
      expect(model.dimensions['economic-classification']
        .attributes[schema['lvl2-code'].slug].parent)
        .to.be.equal(schema['lvl1-code'].slug);
    });
    /*
    it('suggests correctly options for data types and measures', function () {
      var fields = [
        {type: 'amount', name: 'measure0'},
        {type: 'fiscalYear:dimension', name: 'transaction-date'},
      ];
      var ret = tp.fieldsToModel(fields);
      expect(ret).to.not.equal(null);
      var model = ret.model;
      expect(model).to.be.ok;
      var schema = ret.schema.fields;
      expect(schema).to.be.ok;
      expect(_.map(schema['measure0'].options, 'name'))
        .to.be.eql([
        "decimalChar",
        "groupChar",
        "currency",
        "factor",
        "direction",
        "phase"
      ]);
      expect(_.map(schema['transaction-date'].options, 'name'))
        .to.be.eql([
        'format'
      ]);
      expect(schema['transaction-date'].options[0].transform('abc'))
        .to.be.equal('fmt:abc');
    });
    it('embeds correctly options in schema, measures and dimensions', function () {
      var fields = [
        {type: 'amount', name: 'measure', options: {
          decimalChar: 'dc',
          groupChar: 'gc',
          currency: 'cur',
          factor: 12,
          direction: 'dir',
          phase: 'pha'
        }, resource: 'res1'},
        {type: 'fiscalPeriod:dimension', name: 'transaction_date', resource: 'res2', options: {
          format: 'fmt:12345'
        }}
      ];
      var ret = tp.fieldsToModel(fields);
      expect(ret).to.not.equal(null);
      var model = ret.model;
      expect(model).to.be.ok;
      expect(model.measures.measure.currency).to.be.equal('cur');
      expect(model.measures.measure.factor).to.be.equal(12);
      expect(model.measures.measure.direction).to.be.equal('dir');
      expect(model.measures.measure.phase).to.be.equal('pha');
      expect(model.dimensions.date.attributes.transaction_date.resource).to.be.equal('res2');
      var schema = ret.schema;
      expect(schema).to.be.ok;
      expect(schema.fields.measure.decimalChar).to.be.equal('dc');
      expect(schema.fields.measure.groupChar).to.be.equal('gc');
      expect(schema.fields.measure.type).to.be.equal('number');
      expect(schema.fields.measure.format).to.be.equal('default');
      expect(schema.fields.transaction_date.type).to.be.equal('date');
      expect(schema.fields.transaction_date.format).to.be.equal('fmt:12345');
    });
    
    it('embeds correctly default values for options in measures', function () {
      var fields = [
          {type: 'amount', name: 'measure0', options: {
              decimalChar: 'dc',
              factor: 12
          }, resource: 'res1'},
          {type: 'fiscalYear:dimension', name: 'transaction_date', resource: 'res2', options: {
              format: 'fmt:12345'
          }}
      ];
      var ret = tp.fieldsToModel(fields);
      expect(ret).to.not.equal(null);
      var model = ret.model;
      expect(model).to.be.ok;
      expect(model.measures.measure.currency).to.be.undefined;
      expect(model.measures.measure.direction).to.be.undefined;
      expect(model.measures.measure.phase).to.be.undefined;
      var schema = ret.schema;
      expect(schema).to.be.ok;
      expect(schema.fields.measure.groupChar).to.be.equal(',');;
    });
    */
  });
});
