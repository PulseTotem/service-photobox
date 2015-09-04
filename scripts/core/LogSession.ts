/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

var moment = require('moment');

class LogSession {

	private _id : string;

	private _date : string;

	private _statut : string;

	constructor(id : string) {
		this._id = id;
		this._date = moment.format();
		this._statut = "START";
	}

	setStatut(statut : string) {
		this._statut = statut;
	}

	getStatut() {
		return this._statut;
	}

	getDate() {
		return this._date;
	}

	getId() {
		return this._id;
	}
}