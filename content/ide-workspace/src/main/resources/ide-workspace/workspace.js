//var hub2 = new FramesMessageHub({
//	topic: 'something',
//	targetOrigin: 'http://localhost:8080'
//});
//$('button').click(function(evt){
//	hub2.post({data:$('#msg').val()});
//});

var hub = new FramesMessageHub({
	topic: 'fileselected',
	targetOrigin: 'http://localhost:8080'
});
$('ul.filelist > li').click(function(evt){
	hub.post({data: JSON.parse($(this).text())});
});
			
			
			
angular.module('workspace', []).controller('WorkspaceController', function ($scope, $http) {
					
	var workspacesSvcUrl = "../../ide/workspaces";
	$scope.selectedWs;
	$scope.jstree;
	
	$http.get(workspacesSvcUrl)
		.success(function(data) {
			$scope.workspaces = data;
			if(data[0]) {
				$scope.selectedWs = data[0];
			} else {
				$http.post(workspacesSvcUrl + "/workspace").success(function(data) {
					$scope.selectedWs = data.name;
					$scope.refreshWorkspace();
				});
			}
			$scope.refreshWorkspace();
	});
	
	$scope.refreshWorkspace = function() {
		if($scope.selectedWs){
				$http.get(workspacesSvcUrl + '/' + $scope.selectedWs)
					.success(function(data) {
						$scope.projects = data.projects;
							
						var projects = $scope.projects.map(function(project){
							return build(project);
						})
						if ($scope.jstree) {
							$('.workspace').jstree(true).settings.core.data = projects;
							$('.workspace').jstree(true).refresh();
						} else {
						$scope.jstree = $('.workspace').jstree({
							"core" : {
							  "data" : projects,
							  "themes": {
						            "name": "default-dark",
						            "responsive": false,
						            "dots": false,
									"icons": true,
									'variant' : 'small',
									'stripes' : true
						      		},
							  'check_callback' : function(o, n, p, i, m) {
									if(m && m.dnd && m.pos !== 'i') { return false; }
									if(o === "move_node" || o === "copy_node") {
										if(this.get_node(n).parent === this.get_node(p).id) { return false; }
									}
									return true;
								  }
							  },
					          'contextmenu' : {
									'items' : function(node) {
										var tmp = $.jstree.defaults.contextmenu.items();
										delete tmp.create.action;
										tmp.create.label = "New";
										tmp.create.submenu = {
											"create_folder" : {
												"separator_after"	: true,
												"label"				: "Folder",
												"action"			: function (data) {
													var inst = $.jstree.reference(data.reference),
														obj = inst.get_node(data.reference);
													inst.create_node(obj, { type : "default" }, "last", function (new_node) {
														setTimeout(function () { inst.edit(new_node); },0);
													});
												}
											},
											"create_file" : {
												"label"				: "File",
												"action"			: function (data) {
													var inst = $.jstree.reference(data.reference),
														obj = inst.get_node(data.reference);
													inst.create_node(obj, { type : "file" }, "last", function (new_node) {
														setTimeout(function () { inst.edit(new_node); },0);
													});
												}
											}
										};
										if(this.get_type(node) === "file") {
											delete tmp.create;
										}
										return tmp;
									}
								},
								"plugins": ['state','dnd','sort','types','contextmenu','unique']
						  })
						 .on('select_node.jstree', function (e, data) {
							//hub.post({data: data.node.original._file});
						  })
						 .on('dblclick.jstree', function (e) {
							 var data= $('.workspace').jstree().get_selected(true);
							 hub.post({data: data[0].original._file});
						  })
						  .on('delete_node.jstree', function (e, data) {
						  		$http.delete(workspacesSvcUrl + data.node.original._file.path);
								$.get('?operation=delete_node', { 'id' : data.node.id })
									.fail(function () {
										data.instance.refresh();
									});
							})
							.on('create_node.jstree', function (e, data) {
								$.get('?operation=create_node', { 'type' : data.node.type, 'id' : data.node.parent, 'text' : data.node.text })
									.done(function (d) {
										data.instance.set_id(data.node, d.id);
									})
									.fail(function () {
										data.instance.refresh();
									});
							})
							.on('rename_node.jstree', function (e, data) {
								$.get('?operation=rename_node', { 'id' : data.node.id, 'text' : data.text })
									.done(function (d) {
										data.instance.set_id(data.node, d.id);
									})
									.fail(function () {
										data.instance.refresh();
									});
							})
							.on('move_node.jstree', function (e, data) {
								$.get('?operation=move_node', { 'id' : data.node.id, 'parent' : data.parent })
									.done(function (d) {
										//data.instance.load_node(data.parent);
										data.instance.refresh();
									})
									.fail(function () {
										data.instance.refresh();
									});
							})
							.on('copy_node.jstree', function (e, data) {
								$.get('?operation=copy_node', { 'id' : data.original.id, 'parent' : data.parent })
									.done(function (d) {
										//data.instance.load_node(data.parent);
										data.instance.refresh();
									})
									.fail(function () {
										data.instance.refresh();
									});
							});
						}
				});
			}
	};
	
	var build = function(f){
		var children = [];
		if(f.type=='folder' || f.type=='project'){
			children = f.folders.map(function(_folder){
				return build(_folder)
			});
			var _files = f.files.map(function(_file){
				return build(_file)
			})
			children = children.concat(_files);
		}
		f.label = f.name;
		return {
			"text": f.name,
			"children": children,
			"type": f.type,
			"_file": f,
			"icon": f.type=='file'?'fa fa-file-o':undefined
		}
	}
	
	$scope.selected = function(evt){
		//$scope.selectedWs = this;
		$http.get(workspacesSvcUrl + '/' + $scope.selectedWs)
				.success(function(data) {
						$scope.projects = data.projects;
						$scope.refreshWorkspace();
		});
	};
					
	

});
	
