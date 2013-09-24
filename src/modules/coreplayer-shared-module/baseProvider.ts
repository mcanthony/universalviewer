/// <reference path="../../js/jquery.d.ts" />
import utils = require("../../utils");

export class BaseProvider {
    
    config: any;
    pkg: any;
    assetSequenceIndex: number;
    assetSequence: any;
    type: string;
    dataUri: string;
    isHomeDomain: boolean;
    isOnlyInstance: boolean;
    initialAssetIndex: string;
    embedScriptUri: string;
    initialZoom: string;

    options: any = {
        
    };

    constructor(config: any, pkg: any) {
        this.config = config;
        this.pkg = pkg;

        // add dataBaseUri to options so it can be overridden.
        this.options.dataBaseUri = utils.Utils.getParameterByName('dataBaseUri');

        this.dataUri = utils.Utils.getParameterByName('dataUri');
        this.isHomeDomain = utils.Utils.getParameterByName('isHomeDomain') === "true";
        this.isOnlyInstance = utils.Utils.getParameterByName('isOnlyInstance') === "true";
        this.initialAssetIndex = utils.Utils.getParameterByName('assetIndex');
        this.embedScriptUri = utils.Utils.getParameterByName('embedScriptUri');
        this.initialZoom = utils.Utils.getParameterByName('zoom');

        // get params from querystring, these override hash ones if present.
        var index = utils.Utils.getParameterByName('assetSequenceIndex');

        if (index) {
            this.assetSequenceIndex = parseInt(index);
        } else {
            var hash = utils.Utils.getHashValues('/', parent.document);
            this.assetSequenceIndex = hash[0] || 0;
        }

        // we know that this assetSequence exists because the bootstrapper
        // will have loaded it already.
        this.assetSequence = pkg.assetSequences[this.assetSequenceIndex];

        // replace all ref assetSequences with an object that can store
        // its path and sub structures. they won't get used for anything
        // else without a reload.
        for (var i = 0; i < pkg.assetSequences.length; i++) {
            if (this.pkg.assetSequences[i].$ref) {
                this.pkg.assetSequences[i] = {};
            }
        }

        this.type = this.getRootSection().sectionType.toLowerCase();

        if (this.pkg.rootStructure) {
            this.parseStructures(this.pkg.rootStructure, pkg.assetSequences, '');
        }

        this.parseSections(this.getRootSection(), this.assetSequence.assets, '');
    }

    // the purpose of this is to give each asset in assetSequence.assets
    // a collection of sections it belongs to.
    // it also builds a path string property for each section.
    // this can then be used when a section is clicked in the tree view
    // where getSectionIndex in BaseApp loops though all assets and their
    // associated sections until it finds one with a matching path.
    parseSections(section, assets, path): void {

        section.path = path;

        // replace SectionType with config.js mapping (if exists).
        section.sectionType = this.replaceSectionType(section.sectionType);

        for (var i = 0; i < section.assets.length; i++) {
            var index = section.assets[i];

            var asset = assets[index];

            if (!asset.sections) asset.sections = [];

            asset.sections.push(section);
        }

        if (section.sections) {
            for (var j = 0; j < section.sections.length; j++) {
                this.parseSections(section.sections[j], assets, path + '/' + j);
            }
        }
    }

    parseStructures(structure, assetSequences, path): void {

        structure.path = path;

        if (typeof(structure.assetSequence) != 'undefined') {

            var assetSequence = assetSequences[structure.assetSequence];

            assetSequence.index = structure.assetSequence;
            assetSequence.structure = structure;

            // replace index with actual object ref.
            structure.assetSequence = assetSequence;
        }

        if (structure.structures) {
            for (var j = 0; j < structure.structures.length; j++) {
                this.parseStructures(structure.structures[j], assetSequences, path + '/' + j);
            }
        }
    } 

    replaceSectionType(sectionType: string): string {
        if (this.config.options.sectionMappings[sectionType]) {
            return this.config.options.sectionMappings[sectionType];
        }

        return sectionType;
    }

    getRootSection(): any {
        return this.assetSequence.rootSection;
    }

    getTitle(): string {
        return this.getRootSection().title;
    }
}