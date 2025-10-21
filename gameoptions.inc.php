<?php

/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Chakra implementation : © Nicolas Gocel <nicolas.gocel@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * gameoptions.inc.php
 *
 * Chakra game options description
 * 
 * In this file, you can define your game options (= game variants).
 *   
 * Note: If your game has no variant, you don't have to modify this file.
 *
 * Note²: All options defined in this file should have a corresponding "game state labels"
 *        with the same ID (see "initGameStateLabels" in chakra.game.php)
 *
 * !! It is not a good idea to modify this file when a game is running !!
 *
 */

$game_options = array(
    
    100 => array(
        'name' => totranslate('Module A: Yin-Yang'),
        'values' => array(
            1 => array( 'name' => totranslate('Off'), 'tmdisplay' => totranslate('') ),
            2 => array( 'name' => totranslate('On'), 'tmdisplay' => totranslate('With extension Module A : Yin-Yang'), 'premium' => true, 'majorvariant' => true, 'beta' => true ),
        ),
        'default' => 1
    ),
    101 => array(
        'name' => totranslate('Module D: Objectives'),
        'values' => array(
            1 => array( 'name' => totranslate('Off'), 'tmdisplay' => totranslate('') ),
            2 => array( 'name' => totranslate('On'), 'tmdisplay' => totranslate('With extension Module D : Objectives'), 'premium' => true, 'majorvariant' => true, 'beta' => true ),
        ),
        'default' => 1
    ),

);


