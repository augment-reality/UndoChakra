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
            
            // Confirmation for take/meditate actions
            this.pendingAction = null;
            this.pendingMeditationWarning = false;
            
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
            // Preload the board sprite image to ensure it displays properly
            this.ensureSpecificImageLoading(['img/boards.png']);

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
            
            // Note: Click handlers for energy tokens are attached individually in moveEnergy()
            // to ensure they work correctly after DOM manipulation 
            
             this.addTooltipHtmlToClass( 'inspiration', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_inspiration_title), description: _(this.translatableTexts.tooltip_inspiration_description) }));
            
            // Add individual tooltips for meditation tokens with color information
            for(var color in this.colors) {
                dojo.query('.meditation.' + color).forEach(dojo.hitch(this, function(colorKey) {
                    return function(node) {
                        this.addTooltipHtml(node.id, this.format_block('jstpl_tooltip_common', {
                            title: _(this.translatableTexts.tooltip_meditation_title) + ' : ' + _(this.colors[colorKey]),
                            description: _(this.translatableTexts.tooltip_meditation_description)
                        }));
                    };
                }(color)));
            }
            
            // Add individual tooltips for plenitude tokens with color information
            for(var color in this.colors) {
                var plenitudeId = 'plenitude_' + color;
                if(dojo.byId(plenitudeId)) {
                    this.addTooltipHtml(plenitudeId, this.format_block('jstpl_tooltip_common', {
                        title: _(this.translatableTexts.tooltip_plenitude_title) + ' : ' + _(this.colors[color]),
                        description: _(this.translatableTexts.tooltip_plenitude_description)
                    }));
                }
            }
            
            // Add tooltips for chakra energy placeholders (rows 2-8) indicating the chakra color
            // Only add tooltips to empty placeholders to avoid being obtrusive
            var chakraColors = {
                2: 'purple',
                3: 'darkblue',
                4: 'blue',
                5: 'green',
                6: 'yellow',
                7: 'orange',
                8: 'red'
            };
            
            for(var player_id in gamedatas.players) {
                for(var row = 2; row <= 8; row++) {
                    for(var col = 1; col <= 3; col++) {
                        var phId = 'ph_' + player_id + '_' + row + '_' + col;
                        var phNode = dojo.byId(phId);
                        if(phNode && phNode.children.length === 0) {
                            var chakraColor = chakraColors[row];
                            this.addTooltipHtml(phId, this.format_block('jstpl_tooltip_common', {
                                title: _(this.colors[chakraColor]) + ' ' + _('chakra'),
                                description: _(this.translatableTexts.tooltip_energy_description)
                            }));
                        }
                    }
                }
            }
            
            this.addTooltipHtmlToClass( 'firstPlayer1', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_firstplayer_title), description: _(this.translatableTexts.tooltip_firstplayer_description) }));
            this.addTooltipHtmlToClass( 'imeditatemedit', this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_meditate_title), description: _(this.translatableTexts.tooltip_meditate_description) }));
            
            for(var i=1;i<=8;i++)
            	{
            this.addTooltipHtmlToClass( 'channel_'+i, this.format_block('jstpl_tooltip_common', {title: _(this.translatableTexts.tooltip_channel_title), description: _(this.translatableTexts['tooltip_channel'+i+'_description']) }));
            	}
            
            // Store final round flag and update title if needed
            this.isFinalRound = gamedatas.isFinalRound == 1;
            if(this.isFinalRound) {
                this.updateTitleForFinalRound();
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
        	
        	// Check if this is a channel move by looking at the target location
        	// Channel moves go to player boards during channel state
        	var isChannelMove = energy.location && energy.location !== 'maya' && phid.indexOf('ph_' + energy.location) === 0 && this.stateName === 'channel';
        	
        	if(isChannelMove) {
        	    // For channel moves, animate first then attach to preserve tooltips during animation
        	    var element = dojo.byId(id);
        	    if(element) {
        	        dojo.style(id, 'opacity', '1');
        	        dojo.style(id, 'visibility', 'visible');
        	    }
        	    
        	    var anim = this.slideToObject(id, phid);
        	    dojo.connect(anim, 'onEnd', dojo.hitch(this, function() {
        	        // Use attachToNewParent after animation to properly handle styling
        	        this.attachToNewParent(id, phid);
        	        dojo.style(id, 'position', 'absolute');
        	        dojo.style(id, 'top', '0px');
        	        dojo.style(id, 'left', '0px');
        	        
        	        // Force full opacity on energy token to override any parent inheritance
        	        var energyElement = dojo.byId(id);
        	        if(energyElement) {
        	            energyElement.style.opacity = '1';
        	            energyElement.style.visibility = 'visible';
        	            energyElement.style.setProperty('opacity', '1', 'important');
        	        }
        	        
        	        // Re-add tooltip after animation and DOM manipulation
        	        // Use a small delay to ensure DOM is fully updated
        	        setTimeout(dojo.hitch(this, function() {
        	            if(energy.color == "white") {
        	                this.addTooltipHtml(id, this.format_block('jstpl_tooltip_common', {
        	                    title: _(this.translatableTexts.tooltip_energy_title)+" : "+_(this.colors[energy.color]), 
        	                    description: _(this.translatableTexts.tooltip_energywhite_description)
        	                }));
        	            } else {
        	                this.addTooltipHtml(id, this.format_block('jstpl_tooltip_common', {
        	                    title: _(this.translatableTexts.tooltip_energy_title)+" : "+_(this.colors[energy.color]), 
        	                    description: _(this.translatableTexts.tooltip_energy_description)
        	                }));
        	            }
        	        }), 100);
        	    }));
        	    anim.play();
        	} else {
        	    // Normal move (take action, etc.) - use standard approach
        	    this.attachToNewParent(id, phid);
        	    this.slideToObjectPos(id, phid, 0, 0).play();
        	}
        	
        	// Attach click handler immediately (before setTimeout)
        	// Disconnect any existing handlers first to prevent duplicates
        	var energyNode = dojo.byId(id);
        	if(energyNode) {
        	    // Clear any existing Dojo connections by storing a reference
        	    if(energyNode._dojoConnections) {
        	        energyNode._dojoConnections.forEach(function(conn) {
        	            dojo.disconnect(conn);
        	        });
        	    }
        	    // Attach new handler and store the connection
        	    var connection = dojo.connect(energyNode, 'onclick', this, 'onEnergyMaya');
        	    energyNode._dojoConnections = [connection];
        	}
        	
        	// Always ensure tooltip is present after move (in case it was lost during DOM manipulation)
        	// Use setTimeout to ensure DOM is settled before adding tooltip
        	setTimeout(dojo.hitch(this, function() {
        	    if(energy.color == "white")
        	    {
        	        this.addTooltipHtml( id, this.format_block('jstpl_tooltip_common', {
        	            title: _(this.translatableTexts.tooltip_energy_title)+" : "+_(this.colors[energy.color]), 
        	            description: _(this.translatableTexts.tooltip_energywhite_description)
        	        })); 		
        	    }
        	    else
        	    {
        	        this.addTooltipHtml( id, this.format_block('jstpl_tooltip_common', {
        	            title: _(this.translatableTexts.tooltip_energy_title)+" : "+_(this.colors[energy.color]), 
        	            description: _(this.translatableTexts.tooltip_energy_description)
        	        }));
        	    }
        	}), 100);
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
	                // Replace icon placeholders for all players (spectators and active)
	                $('pagemaintitletext').innerHTML = $('pagemaintitletext').innerHTML.replace("{receive}", '<span class="logIcon blue" ></span> &nbsp;' );
	                $('pagemaintitletext').innerHTML = $('pagemaintitletext').innerHTML.replace("{channel}", '<span class="logIcon ichannel"></span> &nbsp;' );
	                $('pagemaintitletext').innerHTML = $('pagemaintitletext').innerHTML.replace("{meditate}", '<span class="logIcon imeditate"></span> &nbsp;' );
	                
	                if( this.isCurrentPlayerActive() )
	                { 
	            	     // Check if THIS player has no inspiration tokens left
	            	     if(args.args.inspirationsLeft == 0)
	            	     {
                             // Override with warning message only for this player
                             $('pagemaintitletext').innerHTML = "<span style='color:black; font-weight:bold;'>" + _("You must meditate or can only play tokens to your Bhagya Bubbles.") + "</span>";
	            	     }
	            	     
	            	     // Add final round warning if applicable
	            	     if(this.isFinalRound) {
	            	         this.updateTitleForFinalRound();
	            	     }

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
                     
                     // Clear selected/selectable from energy tokens to prepare for new selections
                     dojo.query(".energy").removeClass("selected").removeClass("selectable");
                     
                     if( this.isCurrentPlayerActive())
                     { 
                         // If undo is available (==1), all moves are complete - wait for confirmation
                         // Otherwise, mark energies as selectable based on the possibles array
                         if(args.args.undo != 1)
                         { 
                             // Mark each possible energy as selectable
                             // Only mark as selectable if the energy has actual destination choices
                             for(var energyId in this.possibles)
                             {
                                 // Check if this energy has at least one destination choice
                                 var hasDestinations = false;
                                 for(var choiceIdx in this.possibles[energyId]) {
                                     hasDestinations = true;
                                     break;
                                 }
                                 
                                 if(hasDestinations) {
                                     var energyNode = dojo.byId("energy_"+energyId);
                                     if(energyNode) {
                                         dojo.addClass(energyNode, 'selectable');
                                         
                                         // Ensure click handler is attached
                                         if(energyNode._dojoConnections) {
                                             energyNode._dojoConnections.forEach(function(conn) {
                                                 dojo.disconnect(conn);
                                             });
                                         }
                                         var connection = dojo.connect(energyNode, 'onclick', this, 'onEnergyMaya');
                                         energyNode._dojoConnections = [connection];
                                     }
                                 }
                             }
                         }
                     }
	            	// Note: Preserve 'selected' class on destination placeholders for visual feedback
	            	
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
            // For channel state, preserve destination placeholder selections but clear energy selections
            // This allows the multi-step channel flow to work properly
            if(stateName !== 'channel') {
                dojo.query(".selectable").removeClass("selectable");
                dojo.query(".selected").removeClass("selected");
                dojo.query(".currentInspiration").removeClass("currentInspiration");
            }
            else {
                // During channel state, clear selected class from energy tokens but keep it on placeholders
                dojo.query(".energy.selected").removeClass("selected");
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
                // Remove all existing action buttons individually to preserve container layout
                ['confirm_button', 'cancel_button'].forEach(function(buttonId) {
                    var button = dojo.byId(buttonId);
                    if(button) {
                        dojo.destroy(button);
                    }
                });
                
                // Show confirm/cancel for pending take/meditate actions
                if(this.pendingAction !== null)
                {
                    this.addActionButton('confirm_button', _(this.translatableTexts.confirm), 'onConfirmAction', null, false, 'blue');
                    this.addActionButton('cancel_button', _(this.translatableTexts.cancel), 'onCancelAction', null, false, 'red');
                    
                    // Update status bar if meditation warning is needed
                    if(this.pendingMeditationWarning && $('pagemaintitletext'))
                    {
                        $('pagemaintitletext').innerHTML = "<span style='color:black; font-weight:bold;'>" + _("You have already selected that meditation token, are you sure?") + "</span>";
                    }
                    return;
                }
                
                switch( stateName )
                {
	            case 'channel':
	            case 'pickColor':
	            	// Show Confirm+Cancel when all moves complete (undo available)
	            	// Show only Cancel at the start (before any moves)
	            	// NOTE: Must use args parameter, not this.channelUndo, because 
	            	// onUpdateActionButtons is called BEFORE onEnteringState updates the stored values
	            	if(args && args.undo == 1)
            		{
            		    // All moves complete - player can confirm or cancel entire sequence
            		    this.addActionButton('confirm_button', _(this.translatableTexts.confirm), 'onConfirmChannel', null, false, 'blue');
            		    this.addActionButton('cancel_button', _(this.translatableTexts.cancel) , 'onCancelChannel', null, false, 'red');
            		}
            		else if(args && args.step == 0)
            		{
            		    // At the beginning - player can cancel to exit channel selection
            		    this.addActionButton('cancel_button', _(this.translatableTexts.cancel) , 'onCancelChannel', null, false);
            		}
            		// During intermediate steps (step > 0 && undo == 0), show no buttons
            		// Player must complete the sequence or refresh to restart
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

        /**
         * Check if placing selected energies in a row will harmonize that chakra
         * @param {number} row - The row number (2-8 for chakras)
         * @param {string} selectedIds - Space-separated energy IDs to be placed
         * @return {boolean} true if placement will harmonize the chakra
         */
        willHarmonizeChakra: function(row, selectedIds)
        {
            // Row 1 is not a chakra (it's the universe/bhagya), rows 2-8 are chakras
            // Row 9 is earth (neutralized energies)
            if(row < 2 || row > 8) {
                return false;
            }
            
            // Map row to chakra color
            var chakraColors = {
                2: 'purple',
                3: 'darkblue',
                4: 'blue',
                5: 'green',
                6: 'yellow',
                7: 'orange',
                8: 'red'
            };
            var chakraColor = chakraColors[row];
            
            // Count existing energies in the chakra row for current player
            var existingEnergies = [];
            for(var col = 1; col <= 3; col++) {
                var phId = 'ph_' + this.player_id + '_' + row + '_' + col;
                var phNode = dojo.byId(phId);
                if(phNode && phNode.children.length > 0) {
                    var energyNode = phNode.children[0];
                    if(energyNode && energyNode.classList) {
                        // Get color from classList (second class is the color)
                        for(var i = 0; i < energyNode.classList.length; i++) {
                            var className = energyNode.classList[i];
                            if(this.colors[className]) {
                                existingEnergies.push(className);
                                break;
                            }
                        }
                    }
                }
            }
            
            // Get colors of selected energies to be placed
            var selectedEnergies = [];
            var idList = selectedIds.trim().split(" ");
            for(var i = 0; i < idList.length; i++) {
                var energyId = idList[i].trim();
                if(energyId) {
                    var energyNode = dojo.byId('energy_' + energyId);
                    if(energyNode && energyNode.classList) {
                        for(var j = 0; j < energyNode.classList.length; j++) {
                            var className = energyNode.classList[j];
                            if(this.colors[className]) {
                                selectedEnergies.push(className);
                                break;
                            }
                        }
                    }
                }
            }
            
            // Combine existing and selected energies
            var allEnergies = existingEnergies.concat(selectedEnergies);
            
            // Check if we'll have exactly 3 energies after placement
            if(allEnergies.length !== 3) {
                return false;
            }
            
            // Count matching colors and white energies
            var matchingCount = 0;
            var whiteCount = 0;
            
            for(var i = 0; i < allEnergies.length; i++) {
                if(allEnergies[i] === chakraColor) {
                    matchingCount++;
                }
                if(allEnergies[i] === 'white') {
                    whiteCount++;
                }
            }
            
            // Harmonized if: 3 matching colors OR at least 1 white energy
            return (matchingCount === 3 || whiteCount >= 1);
        },


        ///////////////////////////////////////////////////
        //// Player's action

        onConfirmAction:function(event)
        {
            // Confirm pending take/meditate action
            if(this.pendingAction !== null)
            {
                var action = this.pendingAction;
                this.pendingAction = null;
                this.pendingMeditationWarning = false;
                
                // Execute the AJAX call
                this.ajaxcall(action.url, action.params, this, function( result ) {}, function( is_error ) { });
            }
        },
        
        onCancelAction:function(event)
        {
            // Cancel pending take/meditate action
            this.pendingAction = null;
            this.pendingMeditationWarning = false;
            
            // Restore visual state
            dojo.query(".selected").removeClass("selected");
            dojo.query(".selectable").removeClass("selectable");
            
            // Restore the main title text if needed
            if($('pagemaintitletext') && this.gamedatas && this.gamedatas.gamestate && this.gamedatas.gamestate.descriptionmyturn) {
                var args = this.gamedatas.gamestate.args ? dojo.clone(this.gamedatas.gamestate.args) : {};
                args.you = _('You');
                
                var title = this.format_string_recursive(this.gamedatas.gamestate.descriptionmyturn, args);
                title = title.replace("{receive}", "<span class='logIcon blue'></span> &nbsp;");
                title = title.replace("{channel}", "<span class='logIcon ichannel'></span> &nbsp;");
                title = title.replace("{meditate}", "<span class='logIcon imeditate'></span> &nbsp;");
                $('pagemaintitletext').innerHTML = title;
                
                // Add final round warning if applicable
                if(this.isFinalRound) {
                    this.updateTitleForFinalRound();
                }
            }
            
            // Re-enter state to restore UI
            this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
            this.onEnteringState(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
        },
        
        onConfirmChannel:function(event)
        {
            // Confirm the channel moves when all steps are complete
            if(this.stateName == "channel" && this.channelUndo == 1 && this.checkAction( "actConfirm" ))
            {
                this.ajaxcall('/undochakra/undochakra/actConfirm.html', {
                    lock: true
                }, this, function( result ) {}, function( is_error ) { });
            }
        },
        
        onCancelChannel:function(event)
        {
            // Cancel entire channel sequence (calls actCancel or actUndo based on step)
            if(this.stateName == "channel" || this.stateName == "pickColor")
            {
                if(this.channelStep == 0 && this.checkAction( "actCancel" ))
                {
                    // At step 0, use actCancel to exit gracefully
                    this.ajaxcall('/undochakra/undochakra/actCancel.html', {
                        lock: true
                    }, this, function( result ) {}, function( is_error ) { });
                }
                else if(this.channelUndo == 1 && this.checkAction( "actUndo" ))
                {
                    // When moves are complete, use actUndo to revert everything
                    this.ajaxcall('/undochakra/undochakra/actUndo.html', {
                        lock: true
                    }, this, function( result ) {}, function( is_error ) { });
                }
            }
        },
        
        onColor:function(event)
        {
            dojo.stopEvent( event );  
            if(this.isCurrentPlayerActive())
            {
            	if(event.currentTarget.classList.contains('selectable')  && this.checkAction( "actColor" ) ) { 
            		
            		var color = event.currentTarget.id.split('_')[1];            		
            		
            		// Check if this meditation token is already revealed (during take state)
            		var isAlreadyRevealed = this.stateName == "take" && !dojo.hasClass("meditation_"+this.player_id+"_"+color,"hidden");
            		
            		// Check if there are any hidden (unflipped) meditation tokens remaining for this player
            		var hasHiddenTokens = dojo.query("#playertable_"+this.player_id+" .meditation.hidden").length > 0;
            		
            		// Store pending action for confirmation
                    dojo.query(".leftside .meditation.selectable").removeClass("selectable");
                    dojo.addClass(event.currentTarget, "selected");
            		
            		this.pendingAction = {
            		    url: '/undochakra/undochakra/actColor.html',
            		    params: {
            		        lock: true,
            		        color: color
            		    }
            		};
            		
            		// Set the warning flag only if meditation is already revealed AND there are still hidden tokens
            		this.pendingMeditationWarning = isAlreadyRevealed && hasHiddenTokens;
            		
            		this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate);
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
                        // Mark selected placeholders for visual feedback
                        dojo.query(".energyph.selectable").removeClass("selectable");
                        var numSelected = dojo.query("#maya .energy.selected").length;
                        var emptyPlaceholders = dojo.query(".energyph.row" + row + ":empty");
                        for(var i = 0; i < Math.min(numSelected, emptyPlaceholders.length); i++) {
                            dojo.addClass(emptyPlaceholders[i], "selected");
                        }
                        
                        // Store pending action for confirmation
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
                        // Last inspiration token - check if it will harmonize the chakra
                        var willHarmonize = this.willHarmonizeChakra(row, ids);
                        if(!willHarmonize) {
                            // Not allowed - show error message
                            this.showMessage(_("Using your last Inspiration token is only allowed if it harmonizes the containing Chakra."), "error");
                            return;
                        }
                        // If allowed, proceed as normal (no confirmation dialog)
                        dojo.query(".energyph.selectable").removeClass("selectable");
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
            
            // DEBUG: Comprehensive click tracking
            console.log('=== ENERGY CLICK DEBUG ===');
            console.log('Energy ID:', event.currentTarget.id);
            console.log('Classes:', event.currentTarget.className);
            console.log('Parent:', event.currentTarget.parentNode.id);
            console.log('State:', this.stateName);
            console.log('Is Active Player:', this.isCurrentPlayerActive());
            console.log('Has Selectable Class:', event.currentTarget.classList.contains('selectable'));
              
            if(this.isCurrentPlayerActive())
            {
            	if(event.currentTarget.classList.contains('selectable')) { 
            		
            		console.log('✓ Passed active & selectable checks');
            		
            		if( this.stateName == "take" && this.checkAction( "actTake" ) )
            		{
            		    console.log('→ Processing TAKE action');
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
            		    console.log('→ Routing to CHANNEL action');
            			this.onEnergyChannel(event);
            		}
            	
            	} else {
            	    console.log('✗ Energy NOT selectable');
            	}
            } else {
                console.log('✗ Player NOT active');
            }
            console.log('=========================');
        },
        
        onEnergyChannel:function(event)
        {
            console.log('--- CHANNEL HANDLER ---');
            console.log('State:', this.stateName, 'Can Act:', this.checkAction('actMove'));
            
        	if( this.stateName == "channel" && this.checkAction( "actMove" ) )
    		{
        		this.selectedEnergyId  = event.currentTarget.id.split('_')[1];
        		console.log('Selected Energy ID:', this.selectedEnergyId);
        		console.log('Possibles:', this.possibles);
        		
        		if(!this.possibles[this.selectedEnergyId]) {
        		    console.error('✗ Energy', this.selectedEnergyId, 'NOT in possibles array!');
        		    return; // Exit early if energy not in possibles
        		}
        		
        		// Immediately check and remove selectable to prevent double-processing
        		if(!event.currentTarget.classList.contains('selectable')) {
        		    console.log('✗ Already processed, ignoring');
        		    return; // Already processed, ignore duplicate click
        		}
        		
        		// Immediately remove selectable from this specific energy first
        		event.currentTarget.classList.remove('selectable');
        		console.log('✓ Removed selectable from energy');
        		
        		// possibles[energyId] is an object with choice indices as keys: {0: row, 1: row}
        		// Count the number of destination choices
        		var destinationChoices = [];
        		for(var choiceIdx in this.possibles[this.selectedEnergyId]) {
        		    destinationChoices.push(this.possibles[this.selectedEnergyId][choiceIdx]);
        		}
        		console.log('Destination choices:', destinationChoices);
        		
        		if(destinationChoices.length == 1)
        		{
        		    console.log('→ Single destination, executing move to row', destinationChoices[0]);
        			// Remove selectable from ALL other energies to prevent double-clicks
        			dojo.query(".energy.selectable").removeClass('selectable');
        			
        			// Execute move immediately if only one destination
        			// The server handles the multi-step channel flow and will re-mark energies as selectable
        			this.ajaxcall('/undochakra/undochakra/actMove.html', {
        			    lock: true,
        			    energyId: this.selectedEnergyId,
        			    row: destinationChoices[0]
        			}, this, function( result ) {
        			    console.log('✓ Move AJAX success. Result:', result);
        			}, function( is_error, error_msg ) {
        			    if(is_error) {
        			        console.error('✗ Move AJAX error. msg:', error_msg);
        			    }
        			});
        		}
        		else
        		{
        		    console.log('→ Multiple destinations, showing selectable rows:', destinationChoices);
                    // Clear any previous selections
                    dojo.query(".selected").removeClass("selected"); 
            		
            		// Immediately remove selectable from all energies to prevent issues
            		dojo.query(".energy.selectable").removeClass('selectable');
            		
            		// Mark destination placeholders as selectable
            		for(var i = 0; i < destinationChoices.length; i++)
	                {
            			var row = destinationChoices[i];
            			dojo.query("#playertable_"+this.player_id+" .row"+row+".energyph:empty").addClass("selectable"); 
            			console.log('  - Row', row, 'marked as selectable');
	            	}
        		}
    		} else {
    		    console.log('✗ Not in channel state or cannot act');
    		}
    		console.log('----------------------');
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
            dojo.subscribe( 'finalRound', this, "notif_finalRound" );
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
        	// Add color-specific tooltip for the newly revealed meditation token
        	var meditationId = "meditation_"+notif.args.player_id+"_"+notif.args.color;
        	this.addTooltipHtml(meditationId, this.format_block('jstpl_tooltip_common', {
        	    title: _(this.translatableTexts.tooltip_meditation_title) + ' : ' + _(this.colors[notif.args.color]),
        	    description: _(this.translatableTexts.tooltip_meditation_description)
        	}));
            // Restore the main title text to standard after meditation
            if($('pagemaintitletext') && this.gamedatas && this.gamedatas.gamestate && this.gamedatas.gamestate.descriptionmyturn) {
                var args = this.gamedatas.gamestate.args ? dojo.clone(this.gamedatas.gamestate.args) : {};
                args.you = _('You');
                var title = this.format_string_recursive(this.gamedatas.gamestate.descriptionmyturn, args);
                title = title.replace("{receive}", "<span class='logIcon blue'></span> &nbsp;");
                title = title.replace("{channel}", "<span class='logIcon ichannel'></span> &nbsp;");
                title = title.replace("{meditate}", "<span class='logIcon imeditate'></span> &nbsp;");
                $('pagemaintitletext').innerHTML = title;
            }
             
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
        
        notif_finalRound: function( notif )
        {
            this.isFinalRound = true;
            this.updateTitleForFinalRound();
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
        
        updateTitleForFinalRound: function()
        {
            if($('pagemaintitletext')) {
                var currentTitle = $('pagemaintitletext').innerHTML;
                // Only add warning if not already present
                if(currentTitle.indexOf('THIS IS THE FINAL ROUND') === -1) {
                    var warningHTML = " <span style='color:red; font-weight:bold;'>- THIS IS THE FINAL ROUND</span>";
                    $('pagemaintitletext').innerHTML = currentTitle + warningHTML;
                }
            }
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
