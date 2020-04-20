export const ngBoardgameIO = {
  moduleName: 'bgio',
  debugModuleName: 'bgioDebug',
}

class GameService {
  constructor(game) {
    this.client = BoardgameIO.Client({'game': game})
  }
}

class DebugComponentController {
  constructor(gameService) {
    this.client = gameService.client
    this.moveArgs = ''
  }

  /** Parses [moveArgs] as a [JSON] array and then dynamically applies the result to the move. */
  makeMove(moveName) {
    this.client.moves[moveName].apply(null, JSON.parse(`[${this.moveArgs}]`))
  }
}

class LogEntryComponentController {}

angular.module(ngBoardgameIO.moduleName, [])
  .service('gameService', GameService)

angular.module(ngBoardgameIO.debugModuleName, [ngBoardgameIO.moduleName])
  .component('bgioDebug', {
    'controller': DebugComponentController,
    'templateUrl': 'boardgameio/tpl/debug.ng.html'
  })
  .component('bgioLogEntry', {
    'templateUrl': 'boardgameio/tpl/log-entry.ng.html',
    'controller': LogEntryComponentController,
    'bindings': {
      'value': '<'
    },
  })

