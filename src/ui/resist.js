import { ngBoardgameIO } from './boardgameio/ng.js'

class ResistDashboard {}
class ResistState {
  constructor() {
    this.cells = Array(9).fill(null)
  }
}

angular.module('resist', [
  ngBoardgameIO.moduleName,
  ngBoardgameIO.debugModuleName,
])
  .constant('game', {
    'setup': () => new ResistState(),
    'moves': {
      clickCell(G, ctx, id) {
        G.cells[id] = ctx.currentPlayer
      },
    },
  })
  .component('reDash', {
    'controller': ResistDashboard,
    'templateUrl': 'tpl/dashboard.ng.html',
  })
angular.bootstrap(document.body, ['resist'])
