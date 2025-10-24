/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Chakra implementation : © Nicolas Gocel <nicolas.gocel@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * chakra.js
 *
 * Chakra user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare("bgagame.undochakra", ebg.core.gamegui, {
        constructor: function(){
              
            // Here, you can init the global variables of your user interface
            // Example:
            // this.myGlobalValue = 0;
            
            this.colors = {
                    "purple" : "purple",
                    "darkblue" : "dark blue",
                    "blue" : "blue",
                    "green" : "green",
                    "yellow" : "yellow",
                    "orange" : 'orange',
                    "red" : 'red',
                    "black" : 'black',
                    "white" : 'white',
                }
            this.stateName = null;
            this.frees = {};
            this.possibles = {};
            this.selectedEnergyId = null;
            this.inspirationsNotBlocked = 5;
            this.channelStep = 0;
            this.channelUndo = 0;
            
            // Undo confirmation system
            this.pendingAction = null;
            this.pendingActionData = null;
            
            this.translatableTexts = {
                    "cancel": 'Cancel',
                    "confirm": 'Confirm',
                    "tooltip_energy_title": 'Energy',
                    "tooltip_energy_description": 'Place 3 energy with matching color on corresponding Chakra to harmonize it.',
                    "tooltip_energywhite_description": 'When a chakra contains 3 energies including at least one white energy, it\'s considered temporarily harmonised.<br/>At the end of your turn, if a white energy and a black energy are in the same chakra, they mutually annihilate and give you one half of a Yin-Yang symbol.',
                    "tooltip_inspiration_title": 'Inspiration token',
                    "tooltip_inspiration_description": 'Inspiration is used to place energy on a Chakra or channel energy.',
                    "tooltip_meditation_title": 'Meditation token',
                    "tooltip_meditation_description": 'While meditating, select a meditation token to reveal the corresponding Plenitude token.',
                    "tooltip_plenitude_title": 'Plenitude token',
                    "tooltip_plenitude_description": 'At the end of the game, you score the number of points written on the plenitude token corresponding to the Chakra color you harmonized.',
                    "tooltip_firstplayer_title": 'First player token',
                    "tooltip_firstplayer_description": 'The end of the game is triggered when a player has at least five harmonized Chakras at the end of their turn. The current round is finished, allowing all players the same number of turns.',
                    "tooltip_meditate_title": 'Meditate',
                    "tooltip_meditate_description": 'Click on the meditation token with the desired color to meditate.',
                    "tooltip_objective_title": 'Objective',
                    "tooltip_objective_1p": '1 plenitude point',
                    "tooltip_objective_2p": '2 plenitude points',
                    "tooltip_channel_title": 'Channel energy',
                    "tooltip_channel1_description": 'Move one energy down by three Chakras.',
                    "tooltip_channel2_description": 'Move three energy down by one Chakra.',
                    "tooltip_channel3_description": 'Move one energy down by two Chakras, and another energy by one Chakra.',
                    "tooltip_channel4_description": 'Move one energy up by two Chakras.',
                    "tooltip_channel5_description": 'Move two energy up by one Chakra.',
                    "tooltip_channel6_description": 'In the desired order, move one energy down and move another energy up by one Chakra.',
                    "tooltip_channel7_description": 'Move one energy up OR down by one Chakra.',
                    "tooltip_channel8_description": 'Discard one alleviated energy, and then choose one energy from the Universe bag. You must place it in an available Bhagya Bubble.',
                    "confirmation_inspirations":"Are you sure you want to placed your last inspiration token? There is a high risk of you being stuck until the end of the game.",
                    "confirmation_meditate":"You have already meditate on this Chakra. Do you want to continue?",
                    "tooltip_full_yingyang": 'Yin-Yang symbol',
                    "tooltip_full_description": '3 plenitude points',
                    "tooltip_half_yingyang": 'Half Yin-Yang symbol',
                    "tooltip_half_description": '1 plenitude point',
                    
               }
            
           this.objectives = {
                	1 : 'Be the first or second to collect all the Meditation tokens.',	
                	2 : 'Be the first or second to neutralise 3 black energies (move them into the Earth below the red chakra).',	
                	3 : 'Be the first or second to have at least one correct energy in all seven chakras.',	
                	4 : 'Be the first or second to harmonise three adjacent chakras.',	
                	5 : 'Be the first or second to harmonise two pairs of touching chakras.',	
                	6 : 'Be the first or second to harmonise the two indicated chakras : purple and red.',	
                	7 : 'Be the first or second to harmonise the two indicated chakras : blue and yellow.',	
                	8 : 'Be the first or second to harmonise the two indicated chakras : dark blue and orange.',	
            };
        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {

        	dojo.query('.firstPlayerPanel').forEach(dojo.destroy);
        	
            // Setting up player boards
            for( var player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
                         
                for(var id in player.inspirations)
                {
                    var inspiration = player.inspirations[id];
                    this.moveInspiration(inspiration);
                }
                for(var color in gamedatas.plenitudes)
                {
	                if(player[color] > 0)
	                {
	                	var meditationId = "meditation_"+player_id+"_"+color;
	                	if(dojo.byId(meditationId))
	                	{
	                	    dojo.removeClass(meditationId, "hidden");
	                	}
	                }
                }
                if(player.position == 1)
                {
                	dojo.place( this.format_block('jstpl_firstplayer', player), $('timeToThink_' + player_id), "before" );
                	 this.addTooltipHtmlToClass( 'firstPlayerPanel', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_firstplayer_title), description: _(this.translatableTexts.tooltip_firstplayer_description) }));
                }

                dojo.place( this.format_block('jstpl_player_board', player ), $('player_board_'+player_id) );
                
                this.displayYinyang(player_id, parseInt(player.yinyang));
            }
            for(var color in gamedatas.plenitudes)
            {
            	var plenitude = gamedatas.plenitudes[color];
        		dojo.addClass("plenitude_"+color, 'val'+gamedatas.plenitudes[color] );
            }
            
            for(var en_id in gamedatas.energies)
            {
            	var energy = gamedatas.energies[en_id];
            	this.moveEnergy(energy);
            }
            
            var withObjo = false;            
            for(var en_id in gamedatas.objectives)
            {
            	withObjo = true;
            	var objective = gamedatas.objectives[en_id];
            	dojo.place( this.format_block('jstpl_objective', objective), $('objectives')); 
            	this.addTooltipHtml( 'objective_'+objective['type'], this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_objective_title), description: _(this.objectives[objective['type']]) }));
                
            	if(objective['token1'] == null)
            	{
            		dojo.place( this.format_block('jstpl_obj_points', {points: 1, id: objective['id']}), $('objective_'+objective['type'])); 
                }
            	else
            	{
            		dojo.place( this.format_block('jstpl_obj_points', {points: 1, id: objective['id']}), $('cp_board_'+objective['token1'])); 
                }
            	if(objective['token2'] == null)
            	{
            		dojo.place( this.format_block('jstpl_obj_points', {points: 2, id: objective['id']}), $('objective_'+objective['type'])); 
                }
            	else
            	{
            		dojo.place( this.format_block('jstpl_obj_points', {points: 2, id: objective['id']}), $('cp_board_'+objective['token2'])); 
                }
            	this.addTooltipHtml( 'objective_'+objective['id']+"_1", this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_objective_1p), description: _(this.objectives[objective['type']]) }));
            	this.addTooltipHtml( 'objective_'+objective['id']+"_2", this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_objective_2p), description: _(this.objectives[objective['type']]) }));
                 
            }
            
            if(!withObjo)
            {
            	dojo.query('#objectives').forEach(dojo.destroy);
            }
            
            dojo.query('.energyph').connect('onclick', this, 'onEnergyBoardPlaceHolder'); 
            dojo.query('.placeholder.channel').connect('onclick', this, 'onChannel'); 
            dojo.query('.color').connect('onclick', this, 'onColor'); 
            dojo.query('.meditation').connect('onclick', this, 'onColor'); 
            
             this.addTooltipHtmlToClass( 'inspiration', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_inspiration_title), description: _(this.translatableTexts.tooltip_inspiration_description) }));
            this.addTooltipHtmlToClass( 'meditation', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_meditation_title), description: _(this.translatableTexts.tooltip_meditation_description) }));
            this.addTooltipHtmlToClass( 'plenitude', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_plenitude_title), description: _(this.translatableTexts.tooltip_plenitude_description) }));
            this.addTooltipHtmlToClass( 'firstPlayer1', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_firstplayer_title), description: _(this.translatableTexts.tooltip_firstplayer_description) }));
            this.addTooltipHtmlToClass( 'imeditatemedit', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_meditate_title), description: _(this.translatableTexts.tooltip_meditate_description) }));
            
            for(var i=1;i<=8;i++)
            	{
            this.addTooltipHtmlToClass( 'channel_'+i, this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_channel_title), description: _(this.translatableTexts['tooltip_channel'+i+'_description']) }));
            	}
            
            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();
        },
       
        moveEnergy: function(energy)
        {
        	var id = "energy_"+energy.id;
        	var phid = "ph_"+energy.location+"_"+energy.row+"_"+energy.col;
        	
        	if(dojo.byId(id) == null)
        	{
        	   	dojo.place(this.format_block('jstpl_energy', energy), $('maya'));  
        	}
        	
        	this.attachToNewParent(id, phid);
        	this.slideToObjectPos( id, phid,0,0 ).play();   	
        	if(energy.color == "white")
        	{
        		this.addTooltipHtml( id, this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_energy_title)+" : "+_(this.colors[energy.color]), description: _(this.translatableTexts.tooltip_energywhite_description) })); 		
        	}
        	else
        	{
        		this.addTooltipHtml( id, this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_energy_title)+" : "+_(this.colors[energy.color]), description: _(this.translatableTexts.tooltip_energy_description) }));
        	}
        	dojo.query('#'+id).connect('onclick', this, 'onEnergyMaya'); 
        },
        
        moveInspiration: function(inspiration)
        {
        	var id = "inspiration_"+inspiration.player_id+"_"+inspiration.id;
        	var phid = "ph_"+inspiration.player_id+"_"+inspiration.location+"_"+inspiration.location_arg;
        	
        	if(dojo.byId(id) && dojo.byId(phid))
        	{
    		    this.slideToObject( id, phid ).play();
        	}
        },

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
        	this.stateName = stateName;
            switch( stateName )
            {            
	            case 'take':
	            	 $('pagemaintitletext').innerHTML = $('pagemaintitletext').innerHTML.replace("{receive}", '<span class="logIcon blue" ></span> &nbsp;' );
	                    $('pagemaintitletext').innerHTML = $('pagemaintitletext').innerHTML.replace("{channel}", '<span class="logIcon ichannel"></span> &nbsp;' );
	                    $('pagemaintitletext').innerHTML = $('pagemaintitletext').innerHTML.replace("{meditate}", '<span class="logIcon imeditate"></span> &nbsp;' );
	                	
	                if( this.isCurrentPlayerActive() )
	                { 

	                    this.inspirationsNotBlocked = args.args.inspirationsNotBlocked;
		            	this.frees = args.args.frees;
	            		dojo.query(".leftside .meditation").addClass("selectable");
		            	if(args.args.inspirationsLeft>0 || args.args.frees[1]>0)
		            	{
		            		dojo.query("#maya .energy").addClass("selectable");
		            		for(var color in args.args.prevent)
		            		{
			            		dojo.query("#maya .energy."+color).removeClass("selectable");		            			
		            		}
		            		
		            		for(var i=1;i<=8;i++)
		            		{
		            			if(args.args.channel[i] == 1)
		            			{
		            				dojo.query("#ph_"+this.player_id+"_channel_"+i).addClass("selectable"); 	
		            			}
		            		}
	            		}
	                }
	            	break;	            
	            
	            case 'channel':
	            	var id = "#inspiration_"+this.getActivePlayerId()+"_"+args.args.inspiration;
	            	this.possibles = args.args.possibles;
	            	this.channelStep = args.args.step;
	            	this.channelUndo = args.args.undo;
	            	
	                this.selectedEnergyId = null;
	            	dojo.query(id).addClass("currentInspiration");
	            	
	            	if( this.isCurrentPlayerActive())
	                { 
	            	    // If undo is available (==1), all moves are complete - wait for confirmation
	            	    // Otherwise, update which energies are selectable based on the possibles array
	            	    if(args.args.undo != 1)
	                    { 
	                        // Clear selectable from all energies first
	                        dojo.query(".energy.selectable").removeClass("selectable");
	                        
	                        // Add selectable to energies in the possibles list
		            	    for(var id in this.possibles)
		                    {
		            		    dojo.addClass("energy_"+id, 'selectable' );
		                    }
	                    }
	                    else
	                    {
	                        // All moves complete - clear selectable from all energies
	                        dojo.query(".energy.selectable").removeClass("selectable");
	                    }
	                }
	            	// Note: Don't clear 'selected' class from destinations here
	            	// We want to preserve visual feedback of which destinations were selected during channel sequence
	            	
	                break;
	                
	            case "pickColor":	            	
            		if( this.isCurrentPlayerActive() )
	                { 
            			dojo.query(".color").addClass('hidden' );
            			for(var color in args.args.colors)
                        {

                			dojo.query(".color."+color).removeClass('hidden' );
                			dojo.query(".color."+color).addClass('selectable' );
                        }
            			
            			dojo.query(".colors").addClass('appears' );
	                }
	            	break;
	           
            }
            
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            // For channel state, DON'T clear anything - onEnteringState handles it
            // This allows the multi-step channel flow to work properly
            if(stateName !== 'channel') {
                dojo.query(".selectable").removeClass("selectable");
                dojo.query(".selected").removeClass("selected");
                dojo.query(".currentInspiration").removeClass("currentInspiration");
            }
            // Note: When transitioning from channel to another state, the new state's
            // onEnteringState will clean up as needed
            
    		dojo.query(".appears").removeClass('appears' );              
        }, 

        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //        
        onUpdateActionButtons: function( stateName, args )
        {
                      
            if( this.isCurrentPlayerActive() )
            {
                // Remove all existing action buttons first to avoid duplicates
                dojo.empty('generalactions');
                
                // Show confirm/cancel buttons if there's a pending action
                if(this.pendingAction !== null)
                {
                    this.addActionButton('confirm_button', _(this.translatableTexts.confirm), 'onConfirmAction', null, false, 'blue');
                    this.addActionButton('cancelaction_button', _(this.translatableTexts.cancel), 'onCancelAction', null, false, 'red');
                    return;
                }
                
                switch( stateName )
                {
	            case 'channel':
	            case 'pickColor':
	            	// Always show Confirm button after making moves (when undo is available)
	            	// This ensures players must confirm their channel sequence
	            	// NOTE: Must use args parameter, not this.channelUndo, because 
	            	// onUpdateActionButtons is called BEFORE onEnteringState updates the stored values
	            	if(args && args.undo == 1)
            		{
            		    this.addActionButton('confirm_button', _(this.translatableTexts.confirm), 'onConfirmAction', null, false, 'blue');
                  	    this.addActionButton('undo2_button', _(this.translatableTexts.cancel) , 'onUndo');
            		}
            		else if(args && args.step == 0)
            		{
            		    // At the beginning, just show cancel to back out
                  	    this.addActionButton('cancel_button', _(this.translatableTexts.cancel) , 'onCancel');
            		}
		            	break;
                }
            }
        },        

        ///////////////////////////////////////////////////
        //// Utility methods
        
        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */


        ///////////////////////////////////////////////////
        //// Player's action

        onCancel:function(event)
        {
        	if( this.checkAction( "actCancel" ) ) {
                this.ajaxcall('/undochakra/undochakra/actCancel.html', {
                    lock:true
                },this, function( result ) {}, function( is_error ) { } );
            }
        },
        
        onUndo:function(event)
        {
        	if( this.checkAction( "actUndo" ) ) {
                this.ajaxcall('/undochakra/undochakra/actUndo.html', {
                    lock:true
                },this, function( result ) {}, function( is_error ) { } );
            }
        },
        
        onConfirmAction:function(event)
        {
            // Handle pending action (for take/meditate)
            if(this.pendingAction !== null)
            {
                // Execute the pending action
                var action = this.pendingAction;
                var data = this.pendingActionData;
                
                // Clear pending state
                this.pendingAction = null;
                this.pendingActionData = null;
                
                // Execute the AJAX call
                this.ajaxcall(action.url, action.params, this, function( result ) {}, function( is_error ) { });
                
                // Update action buttons
                this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
            }
            // Handle channel/pickColor confirmation (when undo is available)
            else if(this.stateName == "channel" && this.channelUndo == 1 && this.checkAction( "actConfirm" ))
            {
                // Confirm the channel moves - proceed to next state
                this.ajaxcall('/undochakra/undochakra/actConfirm.html', {
                    lock: true
                }, this, function( result ) {}, function( is_error ) { });
            }
        },
        
        onCancelAction:function(event)
        {
            // Clear the pending action
            this.pendingAction = null;
            this.pendingActionData = null;
            
            // Restore visual state (remove selections)
            dojo.query(".selected").removeClass("selected");
            dojo.query(".selectable").removeClass("selectable");
            
            // Trigger state re-entry to restore proper UI state
            this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
            this.onEnteringState(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
        },
        
        onColor:function(event)
        {
            dojo.stopEvent( event );  
            if(this.isCurrentPlayerActive())
            {
            	if(event.currentTarget.classList.contains('selectable')  && this.checkAction( "actColor" ) ) { 
            		
            		var color = event.currentTarget.id.split('_')[1];            		
            		if(this.stateName == "take" && !dojo.hasClass("meditation_"+this.player_id+"_"+color,"hidden"))
            		{
            			this.confirmationDialog( _(this.translatableTexts.confirmation_meditate), dojo.hitch( this, function() {

            				dojo.query(".leftside .meditation.selectable").removeClass("selectable");
            				// Mark the selected meditation color to keep it glowing
            				dojo.addClass(event.currentTarget, "selected");
            				
                    		this.pendingAction = {
                    		    url: '/undochakra/undochakra/actColor.html',
                    		    params: {
                    		        lock: true,
                    		        color: color
                    		    }
                    		};
                    		this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
                        } ) ); 
                        return;
            		}
            		else
            		{
                        dojo.query(".leftside .meditation.selectable").removeClass("selectable");
                        // Mark the selected meditation color to keep it glowing
                        dojo.addClass(event.currentTarget, "selected");
                        
                		this.pendingAction = {
                		    url: '/undochakra/undochakra/actColor.html',
                		    params: {
                		        lock: true,
                		        color: color
                		    }
                		};
                		this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
            		}
            		
            		
            	}
            }
        },
        
        onChannel:function(event)
        {
            dojo.stopEvent( event );  
            if(this.isCurrentPlayerActive())
            {
            	if(event.currentTarget.classList.contains('selectable')  && this.checkAction( "actChannel" ) ) { 
            		
            		var id = event.currentTarget.id.split('_')[3];            		

                    // Only clear selectable classes, not selected
                    // The state transition will handle clearing selections if needed
                    dojo.query(".selectable").removeClass("selectable"); 
            		
            		// Execute channel selection immediately - this transitions to the channel state
            		// where the player will select energies to move
            		this.ajaxcall('/undochakra/undochakra/actChannel.html', {
            		    lock: true,
            		    id: id
            		}, this, function( result ) {}, function( is_error ) { });
            	}
            }
        },
        
        onEnergyBoardPlaceHolder:function(event)
        {
            dojo.stopEvent( event );  
            if(this.isCurrentPlayerActive() )
            {
            	if(event.currentTarget.classList.contains('selectable')) { 
            		var ids = "";
            		dojo.query("#maya .selected").forEach(function(selectTag){
            			ids+= selectTag.id.replace("energy_","") +" ";
                    });
            		var row = event.currentTarget.id.split('_')[2];            		

            		
                    if( this.stateName == "take" && this.checkAction( "actTake" ) )
            		{
                    
                    if(this.inspirationsNotBlocked > 1 || row== 1)
                    {
                        // Mark destination placeholders as selected - highlight as many as energies selected
                        dojo.query(".energyph.selectable").removeClass("selectable");
                        
                        // Count selected energies and highlight that many EMPTY placeholders in the target row
                        var numSelected = dojo.query("#maya .energy.selected").length;
                        var emptyPlaceholders = dojo.query(".energyph.row" + row + ":empty");
                        for(var i = 0; i < Math.min(numSelected, emptyPlaceholders.length); i++) {
                            dojo.addClass(emptyPlaceholders[i], "selected");
                        }
                        
                        // Store pending action instead of executing immediately
                        this.pendingAction = {
                            url: '/undochakra/undochakra/actTake.html',
                            params: {
                                lock: true,
                                energyIds: ids,
                                row: row
                            }
                        };
                        this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
                    }
                    else
                    	{
                    	 this.confirmationDialog( _(this.translatableTexts.confirmation_inspirations), dojo.hitch( this, function() {

                             // Mark destination placeholders as selected - highlight as many as energies selected
                             dojo.query(".energyph.selectable").removeClass("selectable");
                             
                             // Count selected energies and highlight that many EMPTY placeholders in the target row
                             var numSelected = dojo.query("#maya .energy.selected").length;
                             var emptyPlaceholders = dojo.query(".energyph.row" + row + ":empty");
                             for(var i = 0; i < Math.min(numSelected, emptyPlaceholders.length); i++) {
                                 dojo.addClass(emptyPlaceholders[i], "selected");
                             }
                             
                             this.pendingAction = {
                                 url: '/undochakra/undochakra/actTake.html',
                                 params: {
                                     lock: true,
                                     energyIds: ids,
                                     row: row
                                 }
                             };
                             this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
                         } ) ); 
                         return;
                    	}
            		}
                    else
                    {     
                        // For channel actions: just execute the move
                        // The energy animation itself provides visual feedback
                        // Don't modify placeholder classes - the server will update state for next move
                        this.ajaxcall('/undochakra/undochakra/actMove.html', {
                            lock: true,
                            energyId: this.selectedEnergyId,
                            row: row
                        }, this, function( result ) {}, function( is_error ) { });
                    }
            	}
            }
        },
        
        
        onEnergyMaya:function(event)
        {
            dojo.stopEvent( event );  
            if(this.isCurrentPlayerActive())
            {
            	if(event.currentTarget.classList.contains('selectable')) { 
            		
            		if( this.stateName == "take" && this.checkAction( "actTake" ) )
            		{
	            		event.currentTarget.classList.toggle('selected');
	            		var parentId = event.currentTarget.parentNode.id;
	            		var row = parentId.split('_')[2];
	            		var col = parentId.split('_')[3];
	            		
	            		if(event.currentTarget.classList.contains('selected'))
	            		{
	            			if(col != 1) dojo.query("#maya .col1 .energy").removeClass("selected"); 
	            			if(col != 2) dojo.query("#maya .col2 .energy").removeClass("selected"); 
	            			if(col != 3) dojo.query("#maya .col3 .energy").removeClass("selected"); 
	            			            			
	            			var id = event.currentTarget.id;
	            			var color = event.currentTarget.classList[1];
	            			
	            			//unselect similar color
	            			dojo.query("#maya .energy."+color).removeClass("selected");
	            			dojo.query("#"+id).addClass("selected");
	            			
	            			if(dojo.query("#maya .col"+col+" .energy.white.selected").length<1 && dojo.query("#maya .col"+col+" .energy.black.selected").length<1)
	            			{
		            			//force white select
		            			if(color != 'black' && dojo.query("#maya .col"+col+" .energy.white").length>0)
		            			{
		            				dojo.query("#maya .col"+col+" .energy.white")[0].classList.add("selected");
		            			}
		            			//force black select
		            			else if(color != 'white' && dojo.query("#maya .col"+col+" .energy.black").length>0)
		            			{
		            				dojo.query("#maya .col"+col+" .energy.black")[0].classList.add("selected");
		            			}
	            			}
	            			
	            			//force black unselect
	            			if(color == 'black')
	            			{
	            				dojo.query("#maya .energy.white").removeClass("selected");
	            			}
	            			else if(color == 'white')
	            			{
	            				dojo.query("#maya .energy.black").removeClass("selected");
	            			}
	            		}
	            		//unselect black -> unselect all
	            		else if(event.currentTarget.classList.contains('black'))
	            		{
	            			//if a color is selected, try to select white
	            			if(dojo.query("#maya .col"+col+" .energy.selected").length > 0 && dojo.query("#maya .col"+col+" .energy.white").length > 0)
	            			{
	            				dojo.query("#maya .col"+col+" .energy.white:first-of-type").addClass("selected");
	            			}
	            			else
	            			{
	            				//otherwise uneselect all
	            				dojo.query("#maya .energy").removeClass("selected"); 
	            			}
	            		} 
	            		//unselect white -> unselect all
	            		else if(event.currentTarget.classList.contains('white'))
	            		{
	            			//if a color is selected, try to select white
	            			if(dojo.query("#maya .col"+col+" .energy.selected").length > 0 && dojo.query("#maya .col"+col+" .energy.black").length > 0)
	            			{
	            				dojo.query("#maya .col"+col+" .energy.black:first-of-type").addClass("selected");
	            			}
	            			else
	            			{
	            				//otherwise uneselect all
	            				dojo.query("#maya .energy").removeClass("selected"); 
	            			}
	            		}          		
	            	
		            	var nb = dojo.query("#maya .energy.selected").length;
		            	// First remove all selectable classes from board
		            	dojo.query("#playertable_"+this.player_id+" .energyph").removeClass("selectable");
		            	
		            	// Then add selectable to valid destinations
		            	for(var row = 1;row<=9;row++)
		            	{
		            		if(this.frees[row]>=nb && nb>0)
		            		{
		            			dojo.query("#playertable_"+this.player_id+" .row"+row+".energyph:empty").addClass("selectable"); 
		            		}
		            	}
	            	}
            		else
            		{
            			this.onEnergyChannel(event);
            		}
            	
            	}
            }
        },
        
        onEnergyChannel:function(event)
        {
        	if( this.stateName == "channel" && this.checkAction( "actMove" ) )
    		{
        		
        		this.selectedEnergyId  = event.currentTarget.id.split('_')[1];
        		if(this.possibles[this.selectedEnergyId].length == 1)
        		{
        			// Execute move immediately if only one destination
        			// The server handles the multi-step channel flow
        			this.ajaxcall('/undochakra/undochakra/actMove.html', {
        			    lock: true,
        			    energyId: this.selectedEnergyId,
        			    row: this.possibles[this.selectedEnergyId][0]
        			}, this, function( result ) {}, function( is_error ) { });
        		}
        		else
        		{
                    // Only clear selected class from energies, not from meditation or destinations
                    dojo.query(".energy.selected").removeClass("selected"); 
            		event.currentTarget.classList.add('selected');
            		
            		for(var r in this.possibles[this.selectedEnergyId])
	                {
            			var row = this.possibles[this.selectedEnergyId][r];
            			dojo.query("#playertable_"+this.player_id+" .row"+row+".energyph:empty").addClass("selectable"); 
	            	}
            		
        		}
    		}
        },
        

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your chakra.game.php file.
        
        */
        setupNotifications: function()
        {
            dojo.subscribe( 'energy', this, "notif_energy" );
            dojo.subscribe( 'inspiration', this, "notif_inspiration" );
            dojo.subscribe( 'destruct', this, "notif_destruct" );
            dojo.subscribe( 'newenergy', this, "notif_newenergy" );
            dojo.subscribe( 'newmeditation', this, "notif_newmeditation" );
            dojo.subscribe( 'reveal', this, "notif_reveal" );
            dojo.subscribe( 'harmonize', this, "notif_harmonize" );
            dojo.subscribe( 'objo', this, "notif_objo" );
            dojo.subscribe( 'yinyang', this, "notif_yinyang" );
        },  

        notif_objo: function( notif )
        {
        	this.attachToNewParent( 'objective_'+notif.args.id+'_'+notif.args.nb, 'cp_board_'+notif.args.player_id );
            this.slideToObjectPos( 'objective_'+notif.args.id+'_'+notif.args.nb, 'cp_board_'+notif.args.player_id,0,0,1000 ).play();
            setTimeout(function() {
            dojo.style('objective_'+notif.args.id+'_'+notif.args.nb, {
                 left: "0px",
                 top:"0px"
             });
            }, 1100);
        },
        
        notif_harmonize: function( notif )
        {
        	this.scoreCtrl[ notif.args.player_id ].toValue( notif.args.score );
        },

        notif_newenergy: function( notif )
        {
        	var energy = notif.args.energy;
        	var id = "energy_"+energy.id;
        	var phid = "ph_"+energy.location+"_"+energy.row+"_"+energy.col;
        	
        	if(dojo.byId(id) == null)
        	{
        	   	dojo.place(this.format_block('jstpl_energy', energy), $('color_'+energy.color));  
        	}
            this.moveEnergy(notif.args.energy);
            
        }, 
        
        notif_newmeditation: function( notif )
        {
        	dojo.removeClass("meditation_"+notif.args.player_id+"_"+notif.args.color, "hidden");
        	dojo.addClass("meditation_"+notif.args.player_id+"_"+notif.args.color, "appears");
        	if(notif.args.value != 0)
        	{
            	var plenitudeId = "plenitude_"+notif.args.color;
                dojo.query("#"+plenitudeId).addClass("val"+notif.args.value); 
        		
        	}
        	 this.addTooltipHtmlToClass( 'meditation', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_meditation_title), description: _(this.translatableTexts.tooltip_meditation_description) }));
             
        }, 

        notif_reveal: function( notif )
        {
        	for(var color in notif.args.plenitudes)
            {
            	var plenitude = notif.args.plenitudes[color];
        		dojo.addClass("plenitude_"+color, 'val'+notif.args.plenitudes[color] );
            }
        }, 
        
        notif_energy: function( notif )
        {
            this.moveEnergy(notif.args.energy);
        }, 
        notif_inspiration: function( notif )
        {
            this.moveInspiration(notif.args.inspiration);
              
        }, 
        notif_destruct: function( notif )
        {
            this.fadeOutAndDestroy(notif.args.id);
        }, 
        notif_yinyang: function( notif )
        {        	
            this.displayYinyang(notif.args.player_id, notif.args.nb);
            this.fadeOutAndDestroy('energy_'+notif.args.energy1);
            this.fadeOutAndDestroy('energy_'+notif.args.energy2);
        }, 
        
        displayYinyang: function(player_id, nb)
        {
        	dojo.query('#cp_board_'+player_id+" .yinyang").forEach(dojo.destroy);
        	for(var i = 0; i<Math.floor(nb/2);i++)
        	{
        		dojo.place( this.format_block('jstpl_yinyangfull', {id: Math.random()}), $('cp_board_'+player_id)); 
        	}
        	for(var i = 0; i<nb%2;i++)
        	{
        		dojo.place( this.format_block('jstpl_yinyanghalf', {id: Math.random()}), $('cp_board_'+player_id)); 
        	}
        	 this.addTooltipHtmlToClass( 'yingyangfull', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_full_yingyang), description: _(this.translatableTexts.tooltip_full_description) }));
         	 this.addTooltipHtmlToClass( 'yingyanghalf', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_half_yingyang), description: _(this.translatableTexts.tooltip_half_description) }));
             
        },
        
        format_string_recursive : function(log, args) {
            try {
                if (log && args && !args.processed) {
                    args.processed = true;

                    var keys = ['energies','meditation','colorcanal','objective_type'];                    
                    
                    for ( var i in keys) {
                        var key = keys[i];
                        if (typeof args[key] == 'string') {
                        	args[key] = this.getTokenDiv(key, args); 
                        }
                    }    
                }
            } catch (e) {
                console.error(log,args,"Exception thrown", e.stack);
            }
            return this.inherited(arguments);
        },
        
        getTokenDiv : function(key, args) {
        	var ret = "";
        	switch(key)
        	{
	        	case 'energies':
	        	var list = args[key].split(" ");
	        	for(var c_id in list)
	            {
	        		var cid = list[c_id];
	        		if(cid != '')
	        			{
	            	var card = this.colors[cid];
	            	ret += '<span class="logIcon '+cid+'" title="'+this.colors[cid]+'"></span>';
	        			}
	            }
	        	break;

	        	case 'meditation':
		            	ret += '<span class="logIcon meditation '+args[key]+'" title="'+this.colors[args[key]]+'"></span>';		        		
		        	break;
	        	case 'colorcanal':
	            	ret += '<span class="logIcon '+args[key]+'" title="'+this.colors[args[key]]+'"></span>';		        		
	        	break;
	        	case 'objective_type':
	            	ret += _(this.objectives[parseInt(args[key])]);		        		
	        	break;
        	}
        	return ret;
       },
        
   });             
});
