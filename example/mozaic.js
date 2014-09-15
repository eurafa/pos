//http://pt.fifa.com/worldfootball/statisticsandrecords/associations/index.html	

var dashboard = $('#dashboard');

var mozaic = angular.module('mozaic', []);

mozaic.directive('mz', function() {
	return {
		restrict: 'E',
		scope: true,
		link : function($scope, $element, $attrs) {
			$scope.medida = $attrs.medida;
			$scope.$watch('cuboParticipacoesFiltrado', function(cuboFiltrado) {
				$scope['soma'] = cuboFiltrado.sum()[$attrs.medida];
			});
			$scope.$watch('cuboParticipacoes', function(cubo) {
				$scope['total'] = cubo.sum()[$attrs.medida];
			});
		},
		templateUrl: 'percentual.html'
	};
});

mozaic.controller('MozaicController', ['$rootScope', '$scope', function($rootScope, $scope) {

	var medidas = ['jogos', 'vitorias', 'empates', 'derrotas', 'gols_a_favor', 'gols_contra'];
	$rootScope.cuboParticipacoes = ps.Cube.deserialize(copaParcicipacoes.data, medidas);

}]);

mozaic.controller('MozaicFilterController', ['$rootScope', '$scope', function($rootScope, $scope) {
	var self = this;

	$scope.fatos = ['ano', 'pais', 'continente'];
	$scope.fato = {};
	$scope.cuboParticipacoesFiltros = {};
	$scope.cuboParticipacoesFiltrado = {};
	
	$scope.atualizarFiltro = function(f, v, fn) {
		if (!$scope.cuboParticipacoesFiltros[f]) {
			$scope.cuboParticipacoesFiltros[f] = [];
		}
		
		var idx = -1;
		if (!v.selecionado) {
			for (var i = 0; i < $scope.cuboParticipacoesFiltros[f].length; i++) {
				if ($scope.cuboParticipacoesFiltros[f][i] == v.valor) {
					idx = i;
					break;
				}
			}
		}
		
		if (idx >= 0) {
			$scope.cuboParticipacoesFiltros[f].splice(idx, 1);
			if ($scope.cuboParticipacoesFiltros[f].length == 0) {
				delete $scope.cuboParticipacoesFiltros[f];
			}
		} else {
			if (fn) {
				$scope.cuboParticipacoesFiltros[f].push(fn(v.valor));
			} else {
				$scope.cuboParticipacoesFiltros[f].push(v.valor);
			}
		}
		
		$scope.atualizarDados();
	};

	$scope.atualizarDados = function() {
		$scope.cuboParticipacoesFiltrado = $rootScope.cuboParticipacoes;
		angular.forEach($scope.cuboParticipacoesFiltros, function(v, f) {
			var vals = $rootScope.cuboParticipacoes.getValues(f);
			for (var i = 0; i < vals.length; i++) {
				if ($.inArray(vals[i], $scope.cuboParticipacoesFiltros[f]) == -1) {
					var m = {};
					m[f] = vals[i];
					$scope.cuboParticipacoesFiltrado = $scope.cuboParticipacoesFiltrado.dice(m);
				}
			}
		});
	};

	$scope.limpar = function(fato) {
		delete $scope.cuboParticipacoesFiltros[fato];
		angular.forEach($scope.fato[fato], function(f, v) {
			f.selecionado = false;
		});
		$scope.atualizarDados();
	};

	self.inicializar = function() {
		for (var i = 0; i < $scope.fatos.length; i++) {
			$scope.fato[$scope.fatos[i]] = {};
			var values = $rootScope.cuboParticipacoes.getValues($scope.fatos[i]);
			for (var j = 0; j < values.length; j++) {
				$scope.fato[$scope.fatos[i]][values[j]] = {};
				$scope.fato[$scope.fatos[i]][values[j]].valor = values[j];
			}
		}
		$scope.atualizarDados();
	};

	self.inicializar();
}]);

mozaic.controller('MozaicRankingController', ['$rootScope', '$scope', function($rootScope, $scope) {
	var self = this;

	$scope.ranking = [];

	self.inicializar = function() {
		var json = [];
		var values = $rootScope.cuboParticipacoes.getValues('pais');
		for (var i = 0; i < values.length; i++) {
			var pais = values[i];
			var cuboPais = $rootScope.cuboParticipacoes.slice({'pais': pais});
			var cuboPaisSomado = cuboPais.sum();
			var vitorias = cuboPaisSomado['vitorias'];
			var empates = cuboPaisSomado['empates'];
			var pontos = (vitorias * 3) + empates;
			json.push({'facts': {'pais': pais}, 'measures': {'pontos': pontos}});
		}

		var cuboRanking = ps.Cube.deserialize(json, ['pontos']).topSum('pais', 'pontos');
		for (v in cuboRanking) {
			var dadosPais = $rootScope.cuboParticipacoes.slice({'pais': v}).sum();
			var medidas = $rootScope.cuboParticipacoes._measureNames;
			var dados = {'pais': v, 'pontos': cuboRanking[v]};
			for (var i = 0; i < medidas.length; i++) {
				dados[medidas[i]] = dadosPais[medidas[i]];
			}

			$scope.ranking.push(dados);
		}
	};

	self.inicializar();
}]);

mozaic.controller('MozaicPaisController', ['$rootScope', '$scope', function($rootScope, $scope) {
	var self = this;

	$scope.paises = [];
	$scope.paisSelecionado;
	$scope.cuboPais = {};

	self.inicializar = function() {
		var json = [];
		$scope.paises = $rootScope.cuboParticipacoes.getValues('pais');
	};

	$scope.$watch('paisSelecionado', function(p) {
		//console.log($rootScope.cuboParticipacoes._measureNames);
		$scope.cuboPais = $rootScope.cuboParticipacoes.slice({'pais': p});
	});

	self.inicializar();
}]);



/*
■ □ ▪ ▫

▪▪▪▪▪▪▪▪▪▪▪▪▪
 ▪ ▪   ▪   ▪ ▪  ▪ ▪▪▪          
▪ ▪ ▪ ▪ ▪ ▪ ▪▪▪ ▪ ▪  
▪ ▪ ▪  ▪ ▪  ▪ ▪ ▪ ▪▪▪
		▪▪▪▪▪▪▪▪▪▪▪▪▪

■ ■ ■ ■ ■ ■ ■ ■ ■
 ■ ■    ■      ■   ■    ■   ■ ■
■ ■ ■  ■ ■    ■   ■ ■   ■  ■
■ ■ ■  ■ ■   ■   ■ ■ ■  ■  ■
■   ■   ■   ■    ■   ■  ■   ■ ■
			■ ■ ■ ■ ■ ■ ■ ■ ■

 ■ ■ ■ ■ ■ ■ ■ ■ ■
 □ □    □ □     ■  □     □   □ □
□ □ □  □   □   ■  □ □    □  □
□   □  □   □  ■  □ □ □   □  □
□   □   □ □  ■  □     □  □   □ □
			■ ■ ■ ■ ■ ■ ■ ■ ■ ■


 ■ ■ ■ ■ ■ ■ ■ ■ ■
 □ □    □ □     ■  □     □   □ □
□ □ □  □   □   ■  □ □    □  □
□   □  □   □  ■  □ □ □   □  □
□   □   □ □  ■  □     □  □   □ □
			■ ■ ■ ■ ■ ■ ■ ■ ■ ■
*/