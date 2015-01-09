//http://pt.fifa.com/worldfootball/statisticsandrecords/associations/index.html	

// each fact record in the data-set has a unix-time. add standardized local-time facts
//ps.Cube.transforms.dateLocal(window.example.data);

var dashboard = $('#dashboard');
var medidas = ['jogos', 'vitorias', 'empates', 'derrotas', 'gols_a_favor', 'gols_contra'];

// turn our fact records into a cube
var copas = ps.Cube.deserialize(copaParcicipacoes.data, medidas);
var copaFiltros = {};

function atualizarFiltro(f, p, fn) {
	var s = $(f).find("option:selected");
	if (s.length > 0) {			
		copaFiltros[p] = [];
		$(f).find("option:selected").each(function() {
			if (fn) {
				copaFiltros[p].push(fn(this.value));
			} else {
				copaFiltros[p].push(this.value);
			}
		});
	} else {
		delete copaFiltros[p];
	}
	atualizarDashboard();
}

function atualizarDashboard() {
	var d = copas;
	for (f in copaFiltros) {
		var v = copas.getValues(f);
		for (var i = 0; i < v.length; i++) {
			if ($.inArray(v[i], copaFiltros[f]) == -1) {
				var m = {};
				m[f] = v[i];
				d = d.dice(m);
			}
		}
	}
	
	for (var i = 0; i < medidas.length; i++) {
		if ($('#dashboard .' + medidas[i])) {
			//console.log(d.sum()[medidas[i]]);
			//console.log($('#dashboard .' + medidas[i]));
			$('#dashboard .' + medidas[i]).html(d.sum()[medidas[i]]);
		}
		var e = $('#gauge');
		if (e.length > 0) {
			e.html('');
			var av = e.attr('val');
			var am = e.attr('max');
			console.log(av + ' ' + eval(av));
			console.log(am + ' ' + eval(am));
			new JustGage({
				id: "gauge", 
				value: eval(av), 
				min: 0,
				max: eval(am),
				title: e.attr('tit'),
				//label: "A",
				levelColorsGradient: false,
				levelColors: ["#ff0000", "#f9c802",	"#a9d70b"]  
			});
		}
		var ind = $('#dashboard .' + medidas[i]).attr('ind');
		if (ind == 'percentual') {
			$('#dashboard .' + medidas[i]).html(d.sum()[medidas[i]] * 100 / copas.sum()[medidas[i]] + '<br/>' + d.sum()[medidas[i]] + '/' + copas.sum()[medidas[i]]);
		}
	}
}

function criarCombo(d, p, f) {
	var filtro = $('<select></select>');
	filtro.attr("multiple", "multiple");
	filtro.attr("size", "5");
	filtro.attr('name', 'filtro-' + p);
	filtro.on('change', 
	function() {
		atualizarFiltro(filtro, p, f);
		/*
		var l = $(this).find("option:selected").length;
		if (l < d.getValues(p).length) {
			var s = 0;
			$(this).find("option:selected").each(function() {
				var m = {};
				m[p] = $(this).text();
				s += d.slice(m).sum().votos;
			});
			console.log(s);
		} else {
			console.log(d.sum().votos);
		}
		*/
	});
	
	var v = $(d.getValues(p)).sort();
	for (var i = 0; i < v.length; i++) {
		filtro.append($('<option/>', {value: v[i]}).append(v[i]));
	}

	var div = $('<div>' + p + ': <br/></div>');
	div.append(filtro);
	return div;
}








FATOS = ['ano', 'pais', 'continente'];
MEDIDAS = ['jogos', 'vitorias', 'empates', 'derrotas', 'gols_a_favor', 'gols_contra'];

var mozaic = angular.module('mozaic', []);

mozaic.filter('total', function() {
	return function($cubo) {
		return $cubo.sum();
	};
});

mozaic.filter('soma', function() {
	return function($cubo) {
		return $cubo.sum();
	};
});

mozaic.filter('media', function() {
	return function($cubo) {
		return $cubo.avg(2);
	};
});

mozaic.filter('vitorias2', ['$sce', function($sce) {
	return function($cubo) {
		return $cubo['vitorias'];
	};
}]);

for (var i = 0; i < MEDIDAS.length; i++) {
	var $medida = MEDIDAS[i];
	mozaic.filter($medida, ['$sce', function($sce) {
		return function($cubo, $medida) {
			return $cubo[$medida];
		};
	}]);
};


mozaic.controller('MozaicController', ['$rootScope', '$scope', function($rootScope, $scope) {
	var self = this;

	self.fato = {};
	
	$rootScope.teste = {"a": "b"};
	self.cuboParticipacoes = {};
	self.cuboParticipacoesFiltros = {};
	self.cuboParticipacoesFiltrado = {};
	
	self.inicializar = function() {
		self.cuboParticipacoes = ps.Cube.deserialize(copaParcicipacoes.data, MEDIDAS);
		for (var i = 0; i < FATOS.length; i++) {
			self.fato[FATOS[i]] = self.cuboParticipacoes.getValues(FATOS[i]);
		}
		self.atualizarDados();
	};

	self.atualizarFiltro = function(f, v, s, fn) {
		if (!self.cuboParticipacoesFiltros[f]) {
			self.cuboParticipacoesFiltros[f] = [];
		}
		
		var idx = -1;
		if (!s) {
			for (var i = 0; i < self.cuboParticipacoesFiltros[f].length; i++) {
				if (self.cuboParticipacoesFiltros[f][i] == v) {
					idx = i;
					break;
				}
			}
		}
		
		if (idx >= 0) {
			self.cuboParticipacoesFiltros[f].splice(idx, 1);
			if (self.cuboParticipacoesFiltros[f].length == 0) {
				delete self.cuboParticipacoesFiltros[f];
			}
		} else {
			if (fn) {
				self.cuboParticipacoesFiltros[f].push(fn(v));
			} else {
				self.cuboParticipacoesFiltros[f].push(v);
			}
		}
		
		self.atualizarDados();
	};

	self.atualizarDados = function() {
		self.cuboParticipacoesFiltrado = self.cuboParticipacoes;
		angular.forEach(self.cuboParticipacoesFiltros, function(v, f) {
			var vals = self.cuboParticipacoes.getValues(f);
			for (var i = 0; i < vals.length; i++) {
				if ($.inArray(vals[i], self.cuboParticipacoesFiltros[f]) == -1) {
					var m = {};
					m[f] = vals[i];
					self.cuboParticipacoesFiltrado = self.cuboParticipacoesFiltrado.dice(m);
				}
			}
		});

		//$rootScope.$broadcast('alterouFiltros', 'o');

		//self.dadosFiltrados['jogos'] = self.cuboParticipacoesFiltrado.sum()['jogos'];
	};
	
	self.getMedida = function(medida) {
		return self.cuboParticipacoes.sum()[medida];
	}
	
	self.getMedidaFiltrada = function(medida) {
		return self.cuboParticipacoesFiltrado.sum()[medida];
	}
	
	self.getMedidaFiltradaPercentual = function(medida) {
		return (self.getMedidaFiltrada(medida) * 100 / self.getMedida(medida));
	}
	
	self.getPercentual = function(medida) {
		return (self.getMedidaFiltrada(medida) * 100 / self.getMedida(medida));
	}
	
	self.inicializar();
}]);

angular.module('mozaic').directive('mozaicPercentual', function() {
	return {
		restrict: 'A',
		scope: false,
		link : function($scope, $element, $attrs) {
			$scope.medida = $attrs.medida;
			$scope.calculo = $attrs.calculo;
			$scope.$watch('mz.cuboParticipacoesFiltrado', function(cuboFiltrado) {
				$scope.soma = cuboFiltrado.sum()[$scope.medida];
			});
			$scope.$watch('mz.cuboParticipacoes', function(cubo) {
				$scope.total = cubo.sum()[$scope.medida];
			});
		},
		templateUrl: 'percentual.html'
	};
});

angular.module('mozaic').directive('mz', function() {
	return {
		restrict: 'E',
		scope: {
			medida: '@',
			soma: '@',
			total: '@'
		},
		//transclude: true,
		link : function($scope, $element, $attrs) {
			//$scope.medida = $attrs.medida;
			console.log('Medida ', $scope.medida);
			console.log('Soma ', $scope.soma);
			//console.log('Teste ', teste);
			console.log('cuboParticipacoesFiltrado 2', this.teste);
			$scope.soma = {};
			$scope.total = {};
			/*
			$scope.$watch('mz.cuboParticipacoesFiltrado', function(cuboFiltrado) {
				$scope['soma'][$scope.medida] = cuboFiltrado.sum()[$scope.medida];
			});
			$scope.$watch('mz.cuboParticipacoes', function(cubo) {
				$scope['total'][$scope.medida] = cubo.sum()[$scope.medida];
			});
*/
		},
		//template: '{{medida}} {{$scope["soma"]}}'
		templateUrl: 'percentual.html'
	};
});

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