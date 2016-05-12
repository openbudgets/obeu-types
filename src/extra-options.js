'use strict';
//osTypes =>obeuTypes
//value => amount
module.exports =
{
  obeuTypes: {
    amount: {
      options: [
        {
          name: 'currency',
          title: 'Currency',
          values: []
        },
        {
          name: 'factor',
          title: 'Factor',
          type: 'number'
        },
        {
          name: 'direction',
          title: 'Direction',
          values: [
            {name: '', value: ''},
            {name: 'Expenditure', value: 'expenditure'},
            {name: 'Revenue', value: 'revenue'}
          ]
        },
        {
          name: 'phase',
          title: 'Phase',
          values: [
            {name: '', value: ''},
            {name: 'Proposed', value: 'proposed'},
            {name: 'Approved', value: 'approved'},
            {name: 'Adjusted', value: 'adjusted'},
            {name: 'Executed', value: 'executed'}
          ]
        }
      ]
    }
  },
  dataTypes: {
    datetime: {
      options: [
        {
          name: 'format',
          title: 'Format',
          defaultValue: '%Y-%m-%dT%H:%M:%SZ',
          transform: (f) => {
            return 'fmt:'+f;
          }
        }
      ]
    },
    date: {
      options: [
        {
          name: 'format',
          title: 'Format',
          defaultValue: '%Y-%m-%d',
          transform: (f) => {
            return 'fmt:'+f;
          }
        }
      ]
    },
    time: {
      options: [
        {
          name: 'format',
          title: 'Format',
          defaultValue: '%H:%M:%SZ',
          transform: (f) => {
            return 'fmt:'+f;
          }
        }
      ]
    },
    number: {
      options: [
        {
          name: 'decimalChar',
          title: 'Decimal Separator',
          defaultValue: '.'
        },
        {
          name: 'groupChar',
          title: 'Grouping Character',
          defaultValue: ','
        }
      ]
    }
  }
};